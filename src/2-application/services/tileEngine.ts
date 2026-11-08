/**
 * Pure domain service for filtering, deduplicating, and sorting tiles.
 * Operates deterministically on tile collections without side effects.
 */
import type { Tile } from '../../1-domain/entities/Tile'
import type { SortMode } from '../../1-domain/entities/BrowserItem'

const hostCache = new Map<string, string>()

export function extractHostname(rawUrl: string): string {
  if (!rawUrl) return ''
  const hit = hostCache.get(rawUrl)
  if (hit !== undefined) return hit

  let host = ''
  try {
    const parsed = new URL(rawUrl)
    host = parsed.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    const match = rawUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^/:]+)/i)
    host = match ? match[1].toLowerCase() : rawUrl.toLowerCase()
  }

  if (hostCache.size >= 300) {
    const firstKey = hostCache.keys().next().value
    if (firstKey) hostCache.delete(firstKey)
  }
  hostCache.set(rawUrl, host)
  return host
}

export function deduplicateTilesByHost(tiles: Tile[]): Tile[] {
  const seenHosts = new Set<string>()
  const result: Tile[] = []

  for (const tile of tiles) {
    const host = extractHostname(tile.url)
    if (!host || seenHosts.has(host)) continue
    seenHosts.add(host)
    result.push(tile)
  }

  return result
}

export function filterTiles(tiles: Tile[], query: string): Tile[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return tiles

  return tiles.filter((tile) => {
    const titleMatch = tile.title.toLowerCase().includes(normalized)
    const hostMatch = extractHostname(tile.url).includes(normalized)
    const urlMatch = tile.url.toLowerCase().includes(normalized)
    return titleMatch || hostMatch || urlMatch
  })
}

export function sortTiles(tiles: Tile[], mode: SortMode): Tile[] {
  const list = [...tiles]

  // Pinned tiles always float to top, preserving internal sort
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }

    if (mode === 'name') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    }

    if (mode === 'mostUsed') {
      if (b.useCount !== a.useCount) {
        return b.useCount - a.useCount
      }
      return b.lastUsedAt - a.lastUsedAt
    }

    // Default order preserves drag-and-drop order safely
    return (a.order ?? 0) - (b.order ?? 0)
  })
}

export function buildSearchUrl(engine: string, query: string): string {
  const q = encodeURIComponent(query.trim())
  switch (engine) {
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${q}`
    case 'brave':
      return `https://search.brave.com/search?q=${q}`
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${q}`
    case 'perplexity':
      return `https://www.perplexity.ai/search?q=${q}`
    case 'chatgpt':
      return `https://chatgpt.com/?q=${q}`
    case 'google':
    default:
      return `https://www.google.com/search?q=${q}`
  }
}

