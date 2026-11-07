/**
 * Multi-tier reliable storage adapter implementing IStoragePort.
 *
 * Tier 1: Synchronous localStorage cache (immediate 0ms reads on app boot, zero visual flash)
 * Tier 2: chrome.storage.local (10MB quota, highly reliable local disk database)
 * Tier 3: chrome.storage.sync (cross-device cloud sync with Google account, quota-protected)
 *
 * Conflict Resolution & Anti-Loss Strategy:
 * - Every write records a high-resolution timestamp (__tabloom_ts).
 * - Reads compare timestamps across localStorage, chrome.storage.local, and chrome.storage.sync.
 *   - The newest timestamp across all tiers ALWAYS wins.
 *   - Local edits made on this machine are NEVER overwritten by stale cloud data.
 *   - Newer cloud edits from another machine seamlessly update local storage.
 *   - Oversized items (>7.5KB) or sync write quota errors safely fall back to local disk
 *     without dropping user settings or shortcuts.
 */
import type { IStoragePort } from '../../1-domain/ports/IStoragePort'

const SYNC_ITEM_BYTE_LIMIT = 7500
const LOCAL_WALLPAPER_KEY = 'tabloom_local_wallpaper'

interface StorageEnvelope<T> {
  __tabloom_val: T
  __tabloom_ts: number
}

function unpackItem<T>(item: unknown): { val: T; ts: number } | null {
  if (item === undefined || item === null) return null
  if (
    typeof item === 'object' &&
    item !== null &&
    '__tabloom_val' in (item as Record<string, unknown>)
  ) {
    const env = item as StorageEnvelope<T>
    return { val: env.__tabloom_val, ts: Number(env.__tabloom_ts) || 0 }
  }
  return { val: item as T, ts: 0 }
}

export class StorageAdapter implements IStoragePort {
  private hasSync(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      Boolean(chrome.storage?.sync)
    )
  }

  private hasLocal(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      Boolean(chrome.storage?.local)
    )
  }

  getSync<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key)
      if (!item) return fallback
      const parsed = JSON.parse(item)
      const unpacked = unpackItem<T>(parsed)
      return unpacked ? unpacked.val : fallback
    } catch {
      return fallback
    }
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    let localRecord: { val: T; ts: number } | null = null
    let syncRecord: { val: T; ts: number } | null = null
    let storageRecord: { val: T; ts: number } | null = null

    // 1. Read synchronous localStorage record
    try {
      const rawLocal = localStorage.getItem(key)
      if (rawLocal) {
        storageRecord = unpackItem<T>(JSON.parse(rawLocal))
      }
    } catch {}

    // 2. Fetch from chrome.storage.local (device authoritative storage)
    if (this.hasLocal()) {
      try {
        const localRes = await new Promise<{ [k: string]: any }>((resolve) => {
          chrome.storage.local.get([key], (items) => {
            if (chrome.runtime?.lastError || !items) resolve({})
            else resolve(items)
          })
        })
        if (localRes && localRes[key] !== undefined) {
          localRecord = unpackItem<T>(localRes[key])
        }
      } catch {}
    }

    // 3. Fetch from chrome.storage.sync (cross-device cloud sync)
    if (this.hasSync()) {
      try {
        const syncRes = await new Promise<{ [k: string]: any }>((resolve) => {
          chrome.storage.sync.get([key], (items) => {
            if (chrome.runtime?.lastError || !items) resolve({})
            else resolve(items)
          })
        })
        if (syncRes && syncRes[key] !== undefined) {
          syncRecord = unpackItem<T>(syncRes[key])
        }
      } catch {}
    }

    // 4. Multi-Tier Timestamp Resolution:
    // Gather all valid candidates and sort by newest timestamp
    const candidates: Array<{ val: T; ts: number }> = []
    if (storageRecord) candidates.push(storageRecord)
    if (localRecord) candidates.push(localRecord)
    if (syncRecord) candidates.push(syncRecord)

    candidates.sort((a, b) => b.ts - a.ts)

    let chosenVal: T | null = candidates.length > 0 ? candidates[0].val : null
    const chosenTs = candidates.length > 0 ? candidates[0].ts : Date.now()

    // If chosen candidate originated from cloud sync and stripped customWallpaper, restore local wallpaper
    if (
      chosenVal &&
      typeof chosenVal === 'object' &&
      'customWallpaper' in (chosenVal as any)
    ) {
      const s = chosenVal as any
      if (!s.customWallpaper) {
        const localWall = await this.getLocalWallpaper()
        if (localWall) s.customWallpaper = localWall
      }
    }

    // Fallback if no records found
    if (chosenVal === null || chosenVal === undefined) {
      chosenVal = fallback
    }

    // Harmonize all tiers to the winning state to prevent future drift
    if (chosenVal !== null && chosenVal !== undefined) {
      this.cacheLocal(key, chosenVal)

      if (this.hasLocal()) {
        try {
          chrome.storage.local.set(
            { [key]: { __tabloom_val: chosenVal, __tabloom_ts: chosenTs } },
            () => {}
          )
        } catch {}
      }

      return chosenVal
    }

    return fallback
  }

  async set<T>(key: string, value: T): Promise<void> {
    const raw = JSON.parse(JSON.stringify(value))
    const now = Date.now()
    const envelope: StorageEnvelope<T> = {
      __tabloom_val: raw,
      __tabloom_ts: now,
    }

    // 1. Immediately write to synchronous localStorage for instant reactivity
    this.cacheLocal(key, raw)

    // Check if we need to split oversized base64 wallpaper before cloud syncing
    let syncPayload = raw
    if (
      raw &&
      typeof raw === 'object' &&
      typeof raw.customWallpaper === 'string' &&
      raw.customWallpaper.startsWith('data:')
    ) {
      await this.saveLocalWallpaper(raw.customWallpaper)
      syncPayload = { ...raw, customWallpaper: '' }
    }

    // 2. Save full payload to chrome.storage.local (10MB quota, reliable local disk)
    if (this.hasLocal()) {
      try {
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [key]: envelope }, () => resolve())
        })
      } catch {}
    }

    // 3. Save to chrome.storage.sync if it fits 8KB per-item quota
    if (this.hasSync()) {
      try {
        const syncEnvelope: StorageEnvelope<any> = {
          __tabloom_val: syncPayload,
          __tabloom_ts: now,
        }
        const jsonStr = JSON.stringify(syncEnvelope)
        if (jsonStr.length <= SYNC_ITEM_BYTE_LIMIT) {
          await new Promise<void>((resolve) => {
            chrome.storage.sync.set({ [key]: syncEnvelope }, () => {
              // Ignore chrome.runtime.lastError (e.g. quota limits) so local storage remains pristine
              if (chrome.runtime?.lastError) {
                // Silently handled: local disk has already saved the data
              }
              resolve()
            })
          })
        }
      } catch {}
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch {}
    if (this.hasLocal()) {
      try {
        chrome.storage.local.remove(key, () => {})
      } catch {}
    }
    if (this.hasSync()) {
      try {
        chrome.storage.sync.remove(key, () => {})
      } catch {}
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch {}
    if (this.hasLocal()) {
      try {
        chrome.storage.local.clear(() => {})
      } catch {}
    }
    if (this.hasSync()) {
      try {
        chrome.storage.sync.clear(() => {})
      } catch {}
    }
  }

  private cacheLocal<T>(key: string, val: T) {
    try {
      const envelope: StorageEnvelope<T> = {
        __tabloom_val: val,
        __tabloom_ts: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(envelope))
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        console.warn(`[Tabloom Storage] LocalStorage quota reached for "${key}". Purging oversized cache keys...`)
        try {
          // Free up memory by purging non-critical/bloated items
          const wall = localStorage.getItem(LOCAL_WALLPAPER_KEY)
          if (wall && wall.length > 50000) {
            localStorage.removeItem(LOCAL_WALLPAPER_KEY)
          }
          localStorage.removeItem('home_tiles_imported_bookmarks')
          localStorage.removeItem('test_big')
          localStorage.removeItem('test_big_6')

          const envelope: StorageEnvelope<T> = {
            __tabloom_val: val,
            __tabloom_ts: Date.now(),
          }
          localStorage.setItem(key, JSON.stringify(envelope))
        } catch (retryErr) {
          console.error(`[Tabloom Storage] LocalStorage write failed after quota purge:`, retryErr)
        }
      }
    }
  }

  private async getLocalWallpaper(): Promise<string> {
    if (this.hasLocal()) {
      try {
        const res = await new Promise<{ [k: string]: any }>((resolve) => {
          chrome.storage.local.get([LOCAL_WALLPAPER_KEY], (items) => {
            resolve(items || {})
          })
        })
        if (res && res[LOCAL_WALLPAPER_KEY] !== undefined) {
          const u = unpackItem<string>(res[LOCAL_WALLPAPER_KEY])
          if (u && typeof u.val === 'string' && u.val) return u.val
        }
      } catch {}
    }
    try {
      const raw = localStorage.getItem(LOCAL_WALLPAPER_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          const u = unpackItem<string>(parsed)
          if (u && typeof u.val === 'string') return u.val
        } catch {
          return raw
        }
      }
    } catch {}
    return ''
  }

  private async saveLocalWallpaper(dataUrl: string): Promise<void> {
    // Only cache to localStorage if lightweight to preserve 5MB quota for shortcuts & settings
    if (dataUrl.length <= 100000) {
      try {
        const envelope: StorageEnvelope<string> = {
          __tabloom_val: dataUrl,
          __tabloom_ts: Date.now(),
        }
        localStorage.setItem(LOCAL_WALLPAPER_KEY, JSON.stringify(envelope))
      } catch {}
    } else {
      try {
        localStorage.removeItem(LOCAL_WALLPAPER_KEY)
      } catch {}
    }

    if (this.hasLocal()) {
      try {
        await new Promise<void>((resolve) => {
          chrome.storage.local.set(
            {
              [LOCAL_WALLPAPER_KEY]: {
                __tabloom_val: dataUrl,
                __tabloom_ts: Date.now(),
              },
            },
            () => resolve()
          )
        })
      } catch {}
    }
  }
}

// One-time startup safeguard: purge oversized wallpaper strings from localStorage to guarantee free quota
try {
  if (typeof localStorage !== 'undefined') {
    const wall = localStorage.getItem(LOCAL_WALLPAPER_KEY)
    if (wall && wall.length > 100000) {
      localStorage.removeItem(LOCAL_WALLPAPER_KEY)
    }
    localStorage.removeItem('test_big')
    localStorage.removeItem('test_big_6')
  }
} catch {}

export const defaultStorageAdapter = new StorageAdapter()
