/**
 * Data importer utility parsing exported Netscape Bookmarks HTML and JSON history dumps.
 * Populates local storage collections enabling 1-click bookmarks and history ingestion.
 */
import type { BrowserItem } from '../../1-domain/entities/BrowserItem'

export function parseBookmarksHtml(html: string): BrowserItem[] {
  const items: BrowserItem[] = []
  const linkRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  let idx = 0
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]?.trim()
    const rawTitle = match[2]?.replace(/<[^>]+>/g, '').trim() || ''
    if (url) {
      items.push({
        id: `imp_bm_${idx++}_${Date.now()}`,
        title: rawTitle,
        url,
        kind: 'bookmark',
      })
    }
  }

  return items
}

export function parseHistoryJson(jsonText: string): BrowserItem[] {
  try {
    const raw = JSON.parse(jsonText)
    const list = Array.isArray(raw) ? raw : raw.history || raw.items || []
    return list
      .filter((it: Record<string, unknown>) => typeof it.url === 'string' && it.url.startsWith('http'))
      .map((it: Record<string, unknown>, idx: number) => ({
        id: `imp_hist_${idx}_${Date.now()}`,
        title: typeof it.title === 'string' ? it.title : '',
        url: it.url as string,
        kind: 'history',
        visitCount: typeof it.visitCount === 'number' ? it.visitCount : 1,
        lastVisitTime: typeof it.lastVisitTime === 'number' ? it.lastVisitTime : Date.now(),
      }))
  } catch {
    return []
  }
}

