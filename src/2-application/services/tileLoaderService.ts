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

    if (settings.dataSourceMode === 'smart-blend' && list.length === 0) {
      if (!cachedTopSites) cachedTopSites = await browser.getTopSites()
      const discovered: Tile[] = cachedTopSites.map((item, idx) => ({
        id: `disc_${item.id}`,
        title: item.title || extractHostname(item.url),
        url: item.url,
        iconMode: 'auto',
        pinned: false,
        useCount: item.visitCount || 0,
        lastUsedAt: item.lastVisitTime || 0,
        order: 1000 + idx,
        source: 'topSite',
      }))
      list = [...list, ...discovered]
    } else if (settings.dataSourceMode === 'history-only') {
      if (!cachedHistory) cachedHistory = await browser.getHistory(200)
      list = cachedHistory.map((item, idx) => ({
        id: `disc_${item.id}`,
        title: item.title || extractHostname(item.url),
        url: item.url,
        iconMode: 'auto',
        pinned: false,
        useCount: item.visitCount || 0,
        lastUsedAt: item.lastVisitTime || 0,
        order: idx,
        source: 'history',
      }))
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

  // Last session: combines recently closed tabs (with restore sessionId) and recent session browsing history
  const recentClosed = await browser.getRecentSessions()
  const recentHistory = await browser.getHistory(50)

  const sessionMap = new Map<string, BrowserItem>()

  // 1. Recently closed tabs from sessions API
  for (const item of recentClosed) {
    if (item.url) sessionMap.set(item.url, item)
  }

  // 2. Newly opened/visited websites from the active/recent browsing session
  for (const item of recentHistory) {
    if (item.url && !sessionMap.has(item.url)) {
      sessionMap.set(item.url, {
        ...item,
        kind: 'recentSession',
      })
    }
  }

  // Sort by recency so newly visited sites appear at the very top
  const combined = Array.from(sessionMap.values()).sort(
    (a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0)
  )

  return combined.map((s, i) => ({
    id: s.id,
    title: s.title || extractHostname(s.url),
    url: s.url,
    iconMode: 'auto',
    pinned: false,
    useCount: s.visitCount || 0,
    lastUsedAt: s.lastVisitTime || 0,
    order: i,
    source: 'history',
    sessionId: s.sessionId,
  }))
}
