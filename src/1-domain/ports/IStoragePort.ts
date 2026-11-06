/**
 * Storage port interface defining persistence operations for tiles, settings, and cache.
 * Decouples application logic from chrome.storage.local and localStorage implementations.
 */

export interface IStoragePort {
  get<T>(key: string, fallback: T): Promise<T>
  getSync?<T>(key: string, fallback: T): T
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}
