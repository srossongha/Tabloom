/**
 * Storage adapter implementing IStoragePort via chrome.storage.sync (cross-device account sync)
 * with chrome.storage.local and localStorage fallbacks for offline caching and quota protection.
 */
import type { IStoragePort } from '../../1-domain/ports/IStoragePort'

const SYNC_ITEM_BYTE_LIMIT = 7500
const LOCAL_WALLPAPER_KEY = 'tabloom_local_wallpaper'

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
      return item ? (JSON.parse(item) as T) : fallback
    } catch {
      return fallback
    }
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    // 1. Try chrome.storage.sync first (user's cloud account across laptops/browsers)
    if (this.hasSync()) {
      try {
        const syncRes = await new Promise<{ [k: string]: any }>((resolve) => {
          chrome.storage.sync.get([key], (items) => {
            if (chrome.runtime?.lastError || !items) resolve({})
            else resolve(items)
          })
        })
        if (syncRes && syncRes[key] !== undefined) {
          const val = syncRes[key] as T
          // If this is app settings and customWallpaper was stripped to fit sync quota,
          // restore local wallpaper if available on this machine
          if (val && typeof val === 'object' && 'customWallpaper' in (val as any)) {
            const settingsObj = val as any
            if (!settingsObj.customWallpaper) {
              const localWall = await this.getLocalWallpaper()
              if (localWall) settingsObj.customWallpaper = localWall
            }
          }
          this.cacheLocal(key, val)
          return val
        }
      } catch {}
    }

    // 2. Try chrome.storage.local next (device-specific or oversized data)
    if (this.hasLocal()) {
      try {
        const localRes = await new Promise<{ [k: string]: any }>((resolve) => {
          chrome.storage.local.get([key], (items) => {
            if (chrome.runtime?.lastError || !items) resolve({})
            else resolve(items)
          })
        })
        if (localRes && localRes[key] !== undefined) {
          const val = localRes[key] as T
          this.cacheLocal(key, val)
          return val
        }
      } catch {}
    }

    // 3. Fallback to localStorage
    return this.getSync(key, fallback)
  }

  async set<T>(key: string, value: T): Promise<void> {
    const raw = JSON.parse(JSON.stringify(value))
    this.cacheLocal(key, raw)

    // Check if we need to split large base64 wallpaper before syncing
    let syncPayload = raw
    if (
      raw &&
      typeof raw === 'object' &&
      typeof raw.customWallpaper === 'string' &&
      raw.customWallpaper.startsWith('data:')
    ) {
      // Save full base64 wallpaper locally
      await this.saveLocalWallpaper(raw.customWallpaper)
      // Strip large data URL from sync payload to stay within 8KB sync quota
      syncPayload = { ...raw, customWallpaper: '' }
    }

    // 1. Save to chrome.storage.local (supports large payloads)
    if (this.hasLocal()) {
      try {
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [key]: raw }, () => resolve())
        })
      } catch {}
    }

    // 2. Save to chrome.storage.sync (syncs to user's Google account across laptops)
    if (this.hasSync()) {
      try {
        const jsonStr = JSON.stringify(syncPayload)
        if (jsonStr.length <= SYNC_ITEM_BYTE_LIMIT) {
          await new Promise<void>((resolve) => {
            chrome.storage.sync.set({ [key]: syncPayload }, () => resolve())
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
      localStorage.setItem(key, JSON.stringify(val))
    } catch {}
  }

  private async getLocalWallpaper(): Promise<string> {
    if (this.hasLocal()) {
      try {
        const res = await new Promise<{ [k: string]: any }>((resolve) => {
          chrome.storage.local.get([LOCAL_WALLPAPER_KEY], (items) => {
            resolve(items || {})
          })
        })
        if (res && typeof res[LOCAL_WALLPAPER_KEY] === 'string') {
          return res[LOCAL_WALLPAPER_KEY]
        }
      } catch {}
    }
    return localStorage.getItem(LOCAL_WALLPAPER_KEY) || ''
  }

  private async saveLocalWallpaper(dataUrl: string): Promise<void> {
    try {
      localStorage.setItem(LOCAL_WALLPAPER_KEY, dataUrl)
    } catch {}
    if (this.hasLocal()) {
      try {
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [LOCAL_WALLPAPER_KEY]: dataUrl }, () => resolve())
        })
      } catch {}
    }
  }
}

export const defaultStorageAdapter = new StorageAdapter()
