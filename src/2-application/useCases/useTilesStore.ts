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

const CUSTOM_KEY = 'tabloom_custom_list'
const LEGACY_CUSTOM_KEY = 'home_tiles_custom_list'
const OVERRIDES_KEY = 'tabloom_overrides'
const LEGACY_OVERRIDES_KEY = 'home_tiles_overrides'
const TELEMETRY_KEY = 'tabloom_telemetry'
const INITIAL_IMPORTED_KEY = 'tabloom_bookmarks_imported'

let storagePort: IStoragePort = defaultStorageAdapter
let browserPort: IBrowserPort | null = null

const DEFAULT_STARTER_TILES: Tile[] = [
  { id: 'starter_1', title: 'YouTube', url: 'https://youtube.com', iconMode: 'auto', displayMode: 'icon', pinned: false, useCount: 15, lastUsedAt: Date.now(), order: 0, source: 'custom' },
  { id: 'starter_2', title: 'GitHub', url: 'https://github.com', iconMode: 'auto', displayMode: 'icon', pinned: false, useCount: 28, lastUsedAt: Date.now(), order: 1, source: 'custom' },
  { id: 'starter_3', title: 'Notion', url: 'https://notion.so', iconMode: 'auto', displayMode: 'icon', pinned: false, useCount: 9, lastUsedAt: Date.now(), order: 2, source: 'custom' },
  { id: 'starter_4', title: 'Reddit', url: 'https://reddit.com', iconMode: 'auto', displayMode: 'icon', pinned: false, useCount: 5, lastUsedAt: Date.now(), order: 3, source: 'custom' },
  { id: 'starter_5', title: 'Discord', url: 'https://discord.com', iconMode: 'auto', displayMode: 'icon', pinned: false, useCount: 12, lastUsedAt: Date.now(), order: 4, source: 'custom' },
  { id: 'starter_6', title: 'Minecraft', url: 'https://minecraft.net', iconMode: 'auto', displayMode: 'icon', pinned: false, useCount: 3, lastUsedAt: Date.now(), order: 5, source: 'custom' },
]

function loadInitialCustomTiles(): Tile[] {
  const current = storagePort.getSync ? storagePort.getSync<Tile[]>(CUSTOM_KEY, []) : []
  if (current && current.length > 0) return current
  const legacy = storagePort.getSync ? storagePort.getSync<Tile[]>(LEGACY_CUSTOM_KEY, []) : []
  if (legacy && legacy.length > 0) return legacy
  return [...DEFAULT_STARTER_TILES]
}

function loadInitialOverrides(): Record<string, TileOverride> {
  const current = storagePort.getSync ? storagePort.getSync<Record<string, TileOverride>>(OVERRIDES_KEY, {}) : {}
  if (current && Object.keys(current).length > 0) return current
  return storagePort.getSync ? storagePort.getSync<Record<string, TileOverride>>(LEGACY_OVERRIDES_KEY, {}) : {}
}

const customTiles = ref<Tile[]>(loadInitialCustomTiles())
const overrides = ref<Record<string, TileOverride>>(loadInitialOverrides())
const telemetry = ref<Record<string, { useCount: number; lastUsedAt: number }>>(storagePort.getSync ? storagePort.getSync(TELEMETRY_KEY, {}) : {})
const tiles = ref<Tile[]>([])
const bookmarkFolders = ref<BookmarkFolder[]>([])
const isLoading = ref<boolean>(false)

// Real-time listener for cross-device/cross-tab sync updates
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' || area === 'local') {
      if (changes[CUSTOM_KEY]) {
        customTiles.value = (changes[CUSTOM_KEY].newValue as Tile[]) || []
      }
      if (changes[OVERRIDES_KEY]) {
        overrides.value = (changes[OVERRIDES_KEY].newValue as Record<string, TileOverride>) || {}
      }
    }
  })
}

export function useTilesStore(browser?: IBrowserPort, storage?: IStoragePort) {
  if (browser) browserPort = browser
  if (storage) storagePort = storage

  async function init() {
    let custom = await storagePort.get<Tile[]>(CUSTOM_KEY, [])
    if (!custom || custom.length === 0) {
      const legacy = await storagePort.get<Tile[]>(LEGACY_CUSTOM_KEY, [])
      if (legacy && legacy.length > 0) {
        custom = legacy
        await storagePort.set(CUSTOM_KEY, custom)
      } else {
        custom = [...DEFAULT_STARTER_TILES]
        await storagePort.set(CUSTOM_KEY, custom)
      }
    }
    customTiles.value = custom

    // First-time collection: import user's browser bookmarks into Tabloom's custom list once
    const isImported = await storagePort.get<boolean>(INITIAL_IMPORTED_KEY, false)
    if (!isImported && browserPort) {
      const browserBookmarks = await browserPort.getBookmarks()
      if (browserBookmarks && browserBookmarks.length > 0) {
        const imported: Tile[] = browserBookmarks.map((b, i) => ({
          id: `bm_tile_${b.id || Date.now() + '_' + i}`,
          title: b.title || extractHostname(b.url),
          url: b.url,
          iconMode: 'auto',
          pinned: false,
          useCount: 0,
          lastUsedAt: 0,
          order: i,
          source: 'custom',
        }))
        const existingHostnames = new Set(customTiles.value.map((t) => extractHostname(t.url)))
        const uniqueImported = imported.filter((t) => !existingHostnames.has(extractHostname(t.url)))
        customTiles.value = [...customTiles.value, ...uniqueImported]
        await storagePort.set(CUSTOM_KEY, customTiles.value)
      } else if (customTiles.value.length === 0) {
        // Fallback for clean browser profiles with zero bookmarks: use top sites as starters
        const topSites = await browserPort.getTopSites()
        if (topSites && topSites.length > 0) {
          customTiles.value = topSites.map((s, i) => ({
            id: `top_tile_${i}`,
            title: s.title || extractHostname(s.url),
            url: s.url,
            iconMode: 'auto',
            pinned: false,
            useCount: 0,
            lastUsedAt: 0,
            order: i,
            source: 'custom',
          }))
          await storagePort.set(CUSTOM_KEY, customTiles.value)
        }
      }
      await storagePort.set(INITIAL_IMPORTED_KEY, true)
    }

    let ovr = await storagePort.get<Record<string, TileOverride>>(OVERRIDES_KEY, {})
    if (!ovr || Object.keys(ovr).length === 0) {
      const legacy = await storagePort.get<Record<string, TileOverride>>(LEGACY_OVERRIDES_KEY, {})
      if (legacy && Object.keys(legacy).length > 0) {
        ovr = legacy
        await storagePort.set(OVERRIDES_KEY, ovr)
      }
    }
    overrides.value = ovr

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
      if (view === 'bookmarks') {
        const processed = deduplicateTilesByHost(applyOverrides(customTiles.value, settings.hiddenUrls))
        tiles.value = processed.slice(0, settings.maxDiscoveredTiles)
        return
      }

      const raw = await fetchRawTilesForView(view, settings, browserPort, force)
      const processed = deduplicateTilesByHost(applyOverrides(raw, settings.hiddenUrls))
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
    tiles.value = [newTile, ...tiles.value]
  }

  async function updateTile(id: string, patch: Partial<Tile>) {
    customTiles.value = customTiles.value.map((t) => (t.id === id ? { ...t, ...patch } : t))
    overrides.value = { ...overrides.value, [id]: { ...(overrides.value[id] || {}), ...patch } }
    await Promise.all([
      storagePort.set(CUSTOM_KEY, customTiles.value),
      storagePort.set(OVERRIDES_KEY, overrides.value),
    ])
    tiles.value = tiles.value.map((t) => (t.id === id ? { ...t, ...patch } : t))
  }

  async function deleteTile(tile: Tile, onHideUrl?: (url: string) => void) {
    customTiles.value = customTiles.value.filter(
      (t) => t.id !== tile.id && extractHostname(t.url) !== extractHostname(tile.url)
    )
    tiles.value = tiles.value.filter(
      (t) => t.id !== tile.id && extractHostname(t.url) !== extractHostname(tile.url)
    )
    await storagePort.set(CUSTOM_KEY, customTiles.value)
    if (onHideUrl) onHideUrl(tile.url)
  }

  async function importFromBrowserBookmarks(): Promise<number> {
    if (!browserPort) return 0
    const fresh = await browserPort.getBookmarks()
    if (!fresh || fresh.length === 0) return 0

    const existingHostnames = new Set(customTiles.value.map((t) => extractHostname(t.url)))
    const newItems: Tile[] = []

    fresh.forEach((b, i) => {
      if (!existingHostnames.has(extractHostname(b.url))) {
        newItems.push({
          id: `bm_tile_${b.id || Date.now() + '_' + i}`,
          title: b.title || extractHostname(b.url),
          url: b.url,
          iconMode: 'auto',
          pinned: false,
          useCount: 0,
          lastUsedAt: 0,
          order: customTiles.value.length + newItems.length,
          source: 'custom',
        })
      }
    })

    if (newItems.length > 0) {
      customTiles.value = [...customTiles.value, ...newItems]
      await storagePort.set(CUSTOM_KEY, customTiles.value)
      tiles.value = deduplicateTilesByHost(applyOverrides(customTiles.value, []))
    }
    return newItems.length
  }

  async function recordClick(tile: Tile) {
    const now = Date.now()
    const prev = telemetry.value[tile.url] || { useCount: 0, lastUsedAt: 0 }
    let updated = { ...telemetry.value, [tile.url]: { useCount: prev.useCount + 1, lastUsedAt: now } }

    // Bound telemetry to max 150 items to keep storage footprint negligible (<8KB)
    const keys = Object.keys(updated)
    if (keys.length > 150) {
      const sortedKeys = keys.sort((a, b) => (updated[b]?.lastUsedAt || 0) - (updated[a]?.lastUsedAt || 0))
      const pruned: Record<string, { useCount: number; lastUsedAt: number }> = {}
      for (let i = 0; i < 120; i++) {
        const k = sortedKeys[i]
        if (k && updated[k]) pruned[k] = updated[k]!
      }
      updated = pruned
    }

    telemetry.value = updated
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
    })
    tiles.value = list
    customTiles.value = [...list]
    await storagePort.set(CUSTOM_KEY, customTiles.value)
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
    importFromBrowserBookmarks,
    recordClick,
    reorder,
  }
}
