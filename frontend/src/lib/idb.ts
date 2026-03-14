/**
 * INTOIT — IndexedDB wrapper
 * Uses the 'idb' package for offline flash card storage + background sync queue.
 */
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'intoit-db'
const DB_VERSION = 1

let _db: IDBPDatabase | null = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Flash cards store
      if (!db.objectStoreNames.contains('cards')) {
        const cards = db.createObjectStore('cards', { keyPath: 'id' })
        cards.createIndex('userId', 'userId')
        cards.createIndex('nextReview', 'nextReview')
      }
      // Sync queue — offline progress updates waiting to be flushed
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
      }
      // Concept cache — LLM content cached locally
      if (!db.objectStoreNames.contains('conceptCache')) {
        db.createObjectStore('conceptCache', { keyPath: 'key' })
      }
    },
  })
  return _db
}

// ─── Flash cards ──────────────────────────────────────────
export const idb = {
  async getCards(userId: string) {
    const db = await getDB()
    return db.getAllFromIndex('cards', 'userId', userId)
  },

  async getDueCards(userId: string) {
    const db = await getDB()
    const all = await db.getAllFromIndex('cards', 'userId', userId)
    const now = Date.now()
    return all.filter(c => c.nextReview <= now)
  },

  async saveCard(card: Record<string, unknown>) {
    const db = await getDB()
    await db.put('cards', card)
  },

  async saveCards(cards: Record<string, unknown>[]) {
    const db = await getDB()
    const tx = db.transaction('cards', 'readwrite')
    await Promise.all([...cards.map(c => tx.store.put(c)), tx.done])
  },

  async deleteCard(id: string) {
    const db = await getDB()
    await db.delete('cards', id)
  },

  // ── Sync queue (background sync) ──────────────────────
  async queueSync(payload: Record<string, unknown>) {
    const db = await getDB()
    await db.add('syncQueue', { ...payload, timestamp: Date.now() })
    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const reg = await navigator.serviceWorker.ready
      await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-progress')
    }
  },

  async flushSyncQueue(): Promise<Record<string, unknown>[]> {
    const db = await getDB()
    const items = await db.getAll('syncQueue')
    await db.clear('syncQueue')
    return items
  },

  // ── Concept content cache ─────────────────────────────
  async getCachedContent(key: string): Promise<string | null> {
    const db = await getDB()
    const entry = await db.get('conceptCache', key)
    if (!entry) return null
    // TTL: 7 days
    if (Date.now() - entry.cachedAt > 7 * 86_400_000) {
      await db.delete('conceptCache', key)
      return null
    }
    return entry.content as string
  },

  async cacheContent(key: string, content: string) {
    const db = await getDB()
    await db.put('conceptCache', { key, content, cachedAt: Date.now() })
  },

  async clearExpiredCache() {
    const db = await getDB()
    const all = await db.getAll('conceptCache')
    const ttl = 7 * 86_400_000
    const tx = db.transaction('conceptCache', 'readwrite')
    for (const entry of all) {
      if (Date.now() - entry.cachedAt > ttl) {
        await tx.store.delete(entry.key)
      }
    }
    await tx.done
  },
}
