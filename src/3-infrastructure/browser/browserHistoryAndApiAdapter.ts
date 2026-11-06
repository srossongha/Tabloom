/**
 * Browser infrastructure adapter implementing IBrowserPort via Chrome extension APIs.
 * Queries live bookmarks, history, tabs, topSites, and sessions with clean localhost fallback.
 */
import type { BookmarkFolder, BrowserItem } from '../../1-domain/entities/BrowserItem'
import type { IBrowserPort } from '../../1-domain/ports/IBrowserPort'

export class BrowserHistoryAndApiAdapter implements IBrowserPort {
  isExtensionEnvironment(): boolean {
    return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id)
  }

  async getBookmarks(folderId?: string): Promise<BrowserItem[]> {
    if (!this.isExtensionEnvironment() || !chrome.bookmarks) {
      const stored = localStorage.getItem('home_tiles_imported_bookmarks')
      return stored ? JSON.parse(stored) : []
    }
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const results: BrowserItem[] = []
        const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[], matched: boolean) => {
          for (const node of nodes) {
            const isMatch = matched || !folderId || node.id === folderId
            if (node.url && (matched || !folderId || isMatch)) {
              results.push({ id: `bm_${node.id}`, title: node.title, url: node.url, kind: 'bookmark' })
            }
            if (node.children) traverse(node.children, isMatch)
          }
        }
        traverse(tree || [], false)
        resolve(results)
      })
    })
  }

  async getBookmarkFolders(): Promise<BookmarkFolder[]> {
    if (!this.isExtensionEnvironment() || !chrome.bookmarks) return [{ id: 'all', title: 'All Bookmarks' }]
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const folders: BookmarkFolder[] = [{ id: 'all', title: 'All Bookmarks' }]
        const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
          for (const n of nodes) {
            if (!n.url && n.title) folders.push({ id: n.id, title: n.title })
            if (n.children) traverse(n.children)
          }
        }
        traverse(tree || [])
        resolve(folders)
      })
    })
  }

  async getHistory(maxResults = 200): Promise<BrowserItem[]> {
    if (!this.isExtensionEnvironment() || !chrome.history) {
      const stored = localStorage.getItem('home_tiles_imported_history')
      return stored ? JSON.parse(stored) : []
    }
    return new Promise((resolve) => {
      chrome.history.search({ text: '', maxResults, startTime: 0 }, (items) => {
        const list: BrowserItem[] = (items || [])
          .filter((it) => Boolean(it.url && it.url.startsWith('http')))
          .map((it) => ({
            id: `hist_${it.id}`,
            title: it.title || '',
            url: it.url || '',
            kind: 'history',
            visitCount: it.visitCount || 0,
            lastVisitTime: it.lastVisitTime || 0,
          }))
        resolve(list)
      })
    })
  }

  async getTopSites(): Promise<BrowserItem[]> {
    if (!this.isExtensionEnvironment() || !chrome.topSites) return []
    return new Promise((resolve) => {
      chrome.topSites.get((sites) => {
        resolve((sites || []).map((s, i) => ({ id: `top_${i}`, title: s.title || '', url: s.url, kind: 'topSite' })))
      })
    })
  }

  async getOpenTabs(): Promise<BrowserItem[]> {
    if (!this.isExtensionEnvironment() || !chrome.tabs) return []
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        resolve((tabs || []).filter((t) => t.url && t.url.startsWith('http')).map((t) => ({
          id: `tab_${t.id}`,
          title: t.title || '',
          url: t.url || '',
          kind: 'openTab',
          favIconUrl: t.favIconUrl,
          tabId: t.id,
          windowId: t.windowId,
        })))
      })
    })
  }

  async getRecentSessions(): Promise<BrowserItem[]> {
    if (!this.isExtensionEnvironment() || !chrome.sessions) return []
    return new Promise((resolve) => {
      chrome.sessions.getRecentlyClosed({ maxResults: 25 }, (sessions) => {
        const res: BrowserItem[] = []
        for (const s of sessions || []) {
          const tab = s.tab
          if (tab?.url && tab.url.startsWith('http')) {
            res.push({
              id: `sess_${tab.sessionId || tab.url}`,
              title: tab.title || '',
              url: tab.url,
              kind: 'recentSession',
              sessionId: tab.sessionId,
              lastVisitTime: s.lastModified ? s.lastModified * 1000 : 0,
            })
          }
        }
        resolve(res)
      })
    })
  }

  async focusTab(tabId: number, windowId?: number): Promise<void> {
    if (!this.isExtensionEnvironment() || !chrome.tabs) return
    if (windowId !== undefined && chrome.windows) await chrome.windows.update(windowId, { focused: true })
    chrome.tabs.update(tabId, { active: true })
    try {
      chrome.tabs.getCurrent((currentTab) => {
        if (currentTab?.id && currentTab.id !== tabId) {
          chrome.tabs.remove(currentTab.id)
        }
      })
    } catch {}
  }

  async closeTab(tabId: number): Promise<void> {
    if (this.isExtensionEnvironment() && chrome.tabs) chrome.tabs.remove(tabId)
  }

  async restoreSession(sessionId: string): Promise<void> {
    if (this.isExtensionEnvironment() && chrome.sessions) {
      chrome.sessions.restore(sessionId)
      try {
        chrome.tabs.getCurrent((currentTab) => {
          if (currentTab?.id) chrome.tabs.remove(currentTab.id)
        })
      } catch {}
    }
  }
}
export const defaultBrowserAdapter = new BrowserHistoryAndApiAdapter()
