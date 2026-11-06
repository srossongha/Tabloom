/**
 * Favicon resolution service utilizing Chrome extension native favicon API with fallbacks.
 * Resolves high-resolution favicons from chrome-extension url, Google S2, or monograms.
 */
import { extractHostname } from '../../2-application/services/tileEngine'

const PALETTE = [
  '#ec4899', '#8b5cf6', '#3b82f6', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#6366f1'
]

const faviconCache = new Map<string, string>()
const monogramCache = new Map<string, { letter: string; color: string }>()

export function resolveFaviconUrl(
  url: string,
  customIcon?: string,
  iconMode: string = 'auto'
): string {
  if (iconMode === 'upload' && customIcon) return customIcon
  if (iconMode === 'custom-url' && customIcon) return customIcon

  const hit = faviconCache.get(url)
  if (hit) return hit

  let res = ''
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    try {
      const u = new URL(chrome.runtime.getURL('/_favicon/'))
      u.searchParams.set('pageUrl', url)
      u.searchParams.set('size', '64')
      res = u.toString()
    } catch {
      // Fallback to Google S2
    }
  }

  if (!res) {
    const domain = extractHostname(url)
    res = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
  }

  if (faviconCache.size >= 250) {
    const first = faviconCache.keys().next().value
    if (first) faviconCache.delete(first)
  }
  faviconCache.set(url, res)
  return res
}

export function generateMonogram(title: string, url: string): { letter: string; color: string } {
  const cacheKey = `${title}_${url}`
  const hit = monogramCache.get(cacheKey)
  if (hit) return hit

  const cleanTitle = (title || extractHostname(url)).trim()
  const letter = (cleanTitle.charAt(0) || '?').toUpperCase()

  let hash = 0
  for (let i = 0; i < cleanTitle.length; i++) {
    hash = (hash << 5) - hash + cleanTitle.charCodeAt(i)
    hash |= 0
  }
  const color = PALETTE[Math.abs(hash) % PALETTE.length] || '#8b5cf6'
  const result = { letter, color }

  if (monogramCache.size >= 250) {
    const first = monogramCache.keys().next().value
    if (first) monogramCache.delete(first)
  }
  monogramCache.set(cacheKey, result)
  return result
}

