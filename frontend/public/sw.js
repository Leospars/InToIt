/**
 * INTOIT Learning — Service Worker
 * Generated base — vite-plugin-pwa will inject the full Workbox precache manifest at build time.
 * This file serves as the development/manual fallback.
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE  = `intoit-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `intoit-dynamic-${CACHE_VERSION}`
const OFFLINE_URL   = '/offline.html'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
]

// ── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// ── Activate ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch strategy ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin API calls (LLM providers)
  if (request.method !== 'GET') return
  if (
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('openai.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('supabase.co')
  ) return

  // Google Fonts — CacheFirst
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, 'intoit-fonts'))
    return
  }

  // App shell — StaleWhileRevalidate
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }

  // Static assets (JS/CSS/images) — CacheFirst
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // API — NetworkFirst with 10s timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, 10000))
    return
  }

  // Default — NetworkFirst
  event.respondWith(networkFirst(request, DYNAMIC_CACHE, 5000))
})

// ── Cache strategies ──────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const fresh = await fetch(request)
  if (fresh.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, fresh.clone())
  }
  return fresh
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then((fresh) => {
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  })
  return cached ?? fetchPromise
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const fresh = await fetch(request, { signal: controller.signal })
    clearTimeout(timeout)
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    const cached = await cache.match(request)
    return cached ?? new Response('Offline', { status: 503 })
  }
}

// ── Background sync for progress updates ─────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress())
  }
})

async function syncProgress() {
  // Flush any queued progress updates stored in IndexedDB
  // Full implementation uses the 'idb' package
  console.log('[SW] Syncing progress...')
}
