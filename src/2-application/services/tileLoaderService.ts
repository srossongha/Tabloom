/**
 * Domain service responsible for querying browser port data and transforming into domain tiles.
 * Isolates async query composition for bookmarks, history, tabs, and sessions.
 */
import type { Tile } from '../../1-domain/entities/Tile'
import type { NavigationTab, BrowserItem } from '../../1-domain/entities/BrowserItem'
import type { AppSettings } from '../../1-domain/entities/AppSettings'
import type { IBrowserPort } from '../../1-domain/ports/IBrowserPort'
import { extractHostname } from './tileEngine'

let cachedBookmarks: Record<string, BrowserItem[]> = {}
let cachedHistory: BrowserItem[] | null = null
let cachedTopSites: BrowserItem[] | null = null

export function clearTileCache() {
  cachedBookmarks = {}
  cachedHistory = null
  cachedTopSites = null
}

export async function fetchRawTilesForView(
  view: NavigationTab,
  settings: AppSettings,
  browser: IBrowserPort,
  force = false,
): Promise<Tile[]> {
  if (force) clearTileCache()

  if (view === 'bookmarks') {
    const folderKey = settings.bookmarkFolder || 'all'
    const folderId = folderKey === 'all' ? undefined : folderKey
    if (!cachedBookmarks[folderKey]) {
      cachedBookmarks[folderKey] = await browser.getBookmarks(folderId)
    }
    const bMarks = cachedBookmarks[folderKey] || []
    let list: Tile[] = bMarks.map((b, i) => ({
      id: b.id,
      title: b.title || extractHostname(b.url),
      url: b.url,
      iconMode: 'auto',
      pinned: false,
      useCount: 0,
      lastUsedAt: 0,
      order: i,
      source: 'bookmark',
    }))

    if ((list.length === 0 || settings.dataSourceMode === 'smart-blend') && settings.dataSourceMode !== 'manual-only') {
      if (!cachedHistory) cachedHistory = await browser.getHistory(200)
      if (!cachedTopSites) cachedTopSites = await browser.getTopSites()
      const discovered: Tile[] = [...cachedTopSites, ...cachedHistory].map((item, idx) => ({
        id: `disc_${item.id}`,
        title: item.title || extractHostname(item.url),
        url: item.url,
        iconMode: 'auto',
        pinned: false,
        useCount: item.visitCount || 0,
        lastUsedAt: item.lastVisitTime || 0,
        order: 1000 + idx,
        source: item.kind === 'topSite' ? 'topSite' : 'history',
      }))
      list = [...list, ...discovered]
    }
    return list
  }

  if (view === 'openTabs') {
    const tabs = await browser.getOpenTabs()
    return tabs.map((t, i) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      iconMode: 'auto',
      pinned: false,
      useCount: 0,
      lastUsedAt: 0,
      order: i,
      source: 'custom',
      tabId: t.tabId,
      windowId: t.windowId,
    }))
  }

  if (view === 'mostVisited') {
    if (!cachedHistory) cachedHistory = await browser.getHistory(200)
    if (!cachedTopSites) cachedTopSites = await browser.getTopSites()
    return [...cachedTopSites, ...cachedHistory].map((item, i) => ({
      id: item.id,
      title: item.title || extractHostname(item.url),
      url: item.url,
      iconMode: 'auto',
      pinned: false,
      useCount: item.visitCount || 0,
      lastUsedAt: item.lastVisitTime || 0,
      order: i,
      source: item.kind === 'topSite' ? 'topSite' : 'history',
    }))
  }

  const sessions = await browser.getRecentSessions()
  return sessions.map((s, i) => ({
    id: s.id,
    title: s.title,
    url: s.url,
    iconMode: 'auto',
    pinned: false,
    useCount: 0,
    lastUsedAt: s.lastVisitTime || 0,
    order: i,
    source: 'history',
    sessionId: s.sessionId,
  }))
}
