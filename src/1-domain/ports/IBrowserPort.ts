/**
 * Browser port interface defining access to browser history, bookmarks, tabs, and sessions.
 * Abstracts Chrome extension APIs to allow graceful fallback in non-extension environments.
 */
import type { BookmarkFolder, BrowserItem } from '../entities/BrowserItem'

export interface IBrowserPort {
  isExtensionEnvironment(): boolean
  getBookmarks(folderId?: string): Promise<BrowserItem[]>
  getBookmarkFolders(): Promise<BookmarkFolder[]>
  getHistory(maxResults?: number): Promise<BrowserItem[]>
  getTopSites(): Promise<BrowserItem[]>
  getOpenTabs(): Promise<BrowserItem[]>
  getRecentSessions(): Promise<BrowserItem[]>
  focusTab(tabId: number, windowId?: number): Promise<void>
  closeTab(tabId: number): Promise<void>
  restoreSession(sessionId: string): Promise<void>
}

