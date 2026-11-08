/**
 * High-performance IndexedDB media storage service for local wallpapers (images, GIFs, videos)
 * and background audio tracks (MP3, WAV, OGG).
 *
 * Avoids chrome.storage quota limits (8KB sync / 10MB local) and JSON serialization delays
 * by storing raw Blobs directly, providing instant zero-lag URL.createObjectURL references.
 */

export interface StoredMediaRecord {
  id: string
  blob: Blob
  name: string
  mimeType: string
  size: number
  updatedAt: number
}

export type MediaMetadata = Omit<StoredMediaRecord, 'blob'>

const DB_NAME = 'tabloom_media_db'
const DB_VERSION = 1
const STORE_NAME = 'media_files'

export class MediaStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null
  private objectUrls: Map<string, string> = new Map()

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available in current environment'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return this.dbPromise
  }

  async saveMedia(
    id: string,
    file: File | Blob,
    name: string
  ): Promise<string> {
    const db = await this.getDB()
    const mimeType = file.type || (id === 'audio' ? 'audio/mpeg' : (name.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image/webp'))

    const record: StoredMediaRecord = {
      id,
      blob: file,
      name,
      mimeType,
      size: file.size,
      updatedAt: Date.now(),
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(record)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })

    // Revoke old object URL if exists to free memory
    const oldUrl = this.objectUrls.get(id)
    if (oldUrl) {
      try {
        URL.revokeObjectURL(oldUrl)
      } catch {}
    }

    const newUrl = URL.createObjectURL(file)
    this.objectUrls.set(id, newUrl)
    return newUrl
  }

  async getMedia(
    id: string
  ): Promise<{ url: string; record: StoredMediaRecord } | null> {
    try {
      const db = await this.getDB()
      const record = await new Promise<StoredMediaRecord | null>(
        (resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly')
          const store = tx.objectStore(STORE_NAME)
          const req = store.get(id)
          req.onsuccess = () => resolve(req.result || null)
          req.onerror = () => reject(req.error)
        }
      )

      if (!record || !record.blob) return null

      // Reuse existing active object URL or create one
      let url = this.objectUrls.get(id)
      if (!url) {
        url = URL.createObjectURL(record.blob)
        this.objectUrls.set(id, url)
      }

      return { url, record }
    } catch {
      return null
    }
  }

  async getMediaUrl(id: string): Promise<string | null> {
    const res = await this.getMedia(id)
    return res ? res.url : null
  }

  async getMediaInfo(id: string): Promise<MediaMetadata | null> {
    try {
      const db = await this.getDB()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.get(id)
        req.onsuccess = () => {
          if (!req.result) resolve(null)
          else {
            const { id: recId, name, mimeType, size, updatedAt } = req.result
            resolve({ id: recId, name, mimeType, size, updatedAt })
          }
        }
        req.onerror = () => reject(req.error)
      })
    } catch {
      return null
    }
  }

  async removeMedia(id: string): Promise<void> {
    const oldUrl = this.objectUrls.get(id)
    if (oldUrl) {
      try {
        URL.revokeObjectURL(oldUrl)
      } catch {}
      this.objectUrls.delete(id)
    }

    try {
      const db = await this.getDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.delete(id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch {}
  }
}

export const mediaStorageService = new MediaStorageService()
