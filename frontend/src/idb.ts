const DB_NAME = 'training-status-cache'
const DB_VERSION = 1
const STORE_NAME = 'responses'

interface CacheEntry {
  url: string
  data: unknown
  cachedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getCached<T>(url: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(url)
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined
        resolve(entry ? (entry.data as T) : null)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCached(url: string, data: unknown): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({ url, data, cachedAt: Date.now() } satisfies CacheEntry)
  } catch {
    // Silently fail — cache is best-effort
  }
}

export async function deleteCached(url: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(url)
  } catch {
    // Silently fail
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
  } catch {
    // Silently fail
  }
}
