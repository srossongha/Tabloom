/**
 * Composable store managing active tiles, custom overrides, drag ordering, and click tracking.
 * Merges live browser data with user modifications, pins, and blacklist filtering.
 */
import { ref } from 'vue'
import type { Tile, TileOverride } from '../../1-domain/entities/Tile'
import type { NavigationTab, BookmarkFolder } from '../../1-domain/entities/BrowserItem'
import type { AppSettings } from '../../1-domain/entities/AppSettings'
import type { IBrowserPort } from '../../1-domain/ports/IBrowserPort'
import type { IStoragePort } from '../../1-domain/ports/IStoragePort'
import { defaultStorageAdapter } from '../../3-infrastructure/storage/storageAdapter'
import { deduplicateTilesByHost, extractHostname } from '../services/tileEngine'
import { fetchRawTilesForView, clearTileCache } from '../services/tileLoaderService'

const CUSTOM_KEY = 'home_tiles_custom_list'
const OVERRIDES_KEY = 'home_tiles_overrides'
const TELEMETRY_KEY = 'home_tiles_telemetry'

let storagePort: IStoragePort = defaultStorageAdapter
let browserPort: IBrowserPort | null = null

const customTiles = ref<Tile[]>(storagePort.getSync ? storagePort.getSync(CUSTOM_KEY, []) : [])
const overrides = ref<Record<string, TileOverride>>(storagePort.getSync ? storagePort.getSync(OVERRIDES_KEY, {}) : {})
const telemetry = ref<Record<string, { useCount: number; lastUsedAt: number }>>(storagePort.getSync ? storagePort.getSync(TELEMETRY_KEY, {}) : {})
const tiles = ref<Tile[]>([])
const bookmarkFolders = ref<BookmarkFolder[]>([])
const isLoading = ref<boolean>(false)

export function useTilesStore(browser?: IBrowserPort, storage?: IStoragePort) {
  if (browser) browserPort = browser
  if (storage) storagePort = storage

  async function init() {
    customTiles.value = await storagePort.get<Tile[]>(CUSTOM_KEY, customTiles.value)
    overrides.value = await storagePort.get<Record<string, TileOverride>>(OVERRIDES_KEY, overrides.value)
    telemetry.value = await storagePort.get(TELEMETRY_KEY, telemetry.value)
    if (browserPort) bookmarkFolders.value = await browserPort.getBookmarkFolders()
  }

  function applyOverrides(raw: Tile[], hiddenUrls: string[]): Tile[] {
    const hiddenSet = new Set(hiddenUrls.map((u) => extractHostname(u)))
    return raw.filter((t) => !hiddenSet.has(extractHostname(t.url))).map((t) => {
      const o = overrides.value[t.id] || overrides.value[t.url]
      const tel = telemetry.value[t.url]
      return {
        ...t,
        ...(o || {}),
        useCount: (o?.order !== undefined ? t.useCount : 0) + (tel?.useCount || t.useCount),
        lastUsedAt: Math.max(t.lastUsedAt, tel?.lastUsedAt || 0),
      }
    })
  }

  async function refresh(view: NavigationTab, settings: AppSettings, force = false) {
    if (!browserPort) return
    if (tiles.value.length === 0) isLoading.value = true
    try {
      const raw = await fetchRawTilesForView(view, settings, browserPort, force)
      const merged = view === 'bookmarks' ? [...customTiles.value, ...raw] : raw
      const processed = deduplicateTilesByHost(applyOverrides(merged, settings.hiddenUrls))
      tiles.value = view === 'openTabs' ? processed : processed.slice(0, settings.maxDiscoveredTiles)
    } finally {
      isLoading.value = false
    }
  }

  async function addCustomTile(data: Omit<Tile, 'id' | 'order' | 'useCount' | 'lastUsedAt' | 'source'>) {
    const newTile: Tile = {
      ...data,
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      order: 0,
      useCount: 0,
      lastUsedAt: Date.now(),
      source: 'custom',
    }
    customTiles.value = [newTile, ...customTiles.value]
    await storagePort.set(CUSTOM_KEY, customTiles.value)
  }

  async function updateTile(id: string, patch: Partial<Tile>) {
    const isCustom = customTiles.value.some((t) => t.id === id)
    if (isCustom) {
      customTiles.value = customTiles.value.map((t) => (t.id === id ? { ...t, ...patch } : t))
      await storagePort.set(CUSTOM_KEY, customTiles.value)
    } else {
      overrides.value = { ...overrides.value, [id]: { ...(overrides.value[id] || {}), ...patch } }
      await storagePort.set(OVERRIDES_KEY, overrides.value)
    }
    tiles.value = tiles.value.map((t) => (t.id === id ? { ...t, ...patch } : t))
  }

  async function deleteTile(tile: Tile, onHideUrl: (url: string) => void) {
    if (tile.source === 'custom') {
      customTiles.value = customTiles.value.filter((t) => t.id !== tile.id)
      await storagePort.set(CUSTOM_KEY, customTiles.value)
      tiles.value = tiles.value.filter((t) => t.id !== tile.id)
    } else {
      onHideUrl(tile.url)
      tiles.value = tiles.value.filter((t) => extractHostname(t.url) !== extractHostname(tile.url))
    }
  }

  async function recordClick(tile: Tile) {
    const now = Date.now()
    const prev = telemetry.value[tile.url] || { useCount: 0, lastUsedAt: 0 }
    telemetry.value = { ...telemetry.value, [tile.url]: { useCount: prev.useCount + 1, lastUsedAt: now } }
    await storagePort.set(TELEMETRY_KEY, telemetry.value)
  }

  async function reorder(fromIdx: number, toIdx: number) {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= tiles.value.length || toIdx >= tiles.value.length) return
    const list = [...tiles.value]
    const [moved] = list.splice(fromIdx, 1)
    if (!moved) return
    list.splice(toIdx, 0, moved)
    list.forEach((t, i) => {
      t.order = i
      overrides.value[t.id] = { ...(overrides.value[t.id] || {}), order: i }
    })
    tiles.value = list
    await storagePort.set(OVERRIDES_KEY, overrides.value)
  }

  return {
    tiles,
    isLoading,
    customTiles,
    bookmarkFolders,
    init,
    refresh,
    clearCache: clearTileCache,
    addCustomTile,
    updateTile,
    deleteTile,
    recordClick,
    reorder,
  }
}
