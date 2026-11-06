/**
 * Storage adapter implementing IStoragePort via chrome.storage.local with localStorage fallback.
 * Provides unified asynchronous persistence across extension and standalone browser environments.
 */
import type { IStoragePort } from '../../1-domain/ports/IStoragePort'

export class StorageAdapter implements IStoragePort {
  private isChromeStorage(): boolean {
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
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime?.lastError || !result || result[key] === undefined) {
              resolve(this.getSync(key, fallback))
            } else {
              const val = result[key] as T
              try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
              resolve(val)
            }
          })
        } catch {
          resolve(this.getSync(key, fallback))
        }
      })
    }
    return this.getSync(key, fallback)
  }

  async set<T>(key: string, value: T): Promise<void> {
    const raw = JSON.parse(JSON.stringify(value))
    try {
      localStorage.setItem(key, JSON.stringify(raw))
    } catch {}

    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [key]: raw }, () => resolve())
        } catch {
          resolve()
        }
      })
    }
  }

  async remove(key: string): Promise<void> {
    try { localStorage.removeItem(key) } catch {}
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        try { chrome.storage.local.remove(key, () => resolve()) } catch { resolve() }
      })
    }
  }

  async clear(): Promise<void> {
    try { localStorage.clear() } catch {}
    if (this.isChromeStorage()) {
      return new Promise((resolve) => {
        try { chrome.storage.local.clear(() => resolve()) } catch { resolve() }
      })
    }
  }
}

export const defaultStorageAdapter = new StorageAdapter()
