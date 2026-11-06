/**
 * Pure domain entity for unified browser items extracted from chrome APIs.
 * Represents bookmarks, history visits, top sites, open tabs, and recent sessions.
 */

export type BrowserItemKind = 'bookmark' | 'history' | 'topSite' | 'openTab' | 'recentSession'

export type NavigationTab = 'bookmarks' | 'openTabs' | 'mostVisited' | 'lastSession'

export type SortMode = 'default' | 'name' | 'mostUsed'

export interface BrowserItem {
  id: string
  title: string
  url: string
  kind: BrowserItemKind
  visitCount?: number
  lastVisitTime?: number
  favIconUrl?: string
  tabId?: number
  windowId?: number
  sessionId?: string
  folderId?: string
}

export interface BookmarkFolder {
  id: string
  title: string
}

