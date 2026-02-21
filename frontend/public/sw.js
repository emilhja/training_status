const CACHE_NAME = 'training-status-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch: Serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Background Sync: queue failed POST /api/fetch requests for retry
  if (request.method === 'POST' && url.pathname === '/api/fetch') {
    event.respondWith(
      fetch(request.clone()).catch(() => {
        return self.registration.sync.register('retry-fetch').then(() => {
          return new Response(JSON.stringify({
            success: false,
            output: '',
            error: 'Offline — fetch will retry when connection is restored.'
          }), { headers: { 'Content-Type': 'application/json' } })
        })
      })
    )
    return
  }

  // Skip other non-GET requests
  if (request.method !== 'GET') return

  // API calls: Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached version if offline
          return caches.match(request)
        })
    )
    return
  }

  // Static assets: Cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone)
        })
        return response
      })
    })
  )
})

// Background Sync: retry queued fetch
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-fetch') {
    event.waitUntil(
      fetch('/api/fetch', { method: 'POST' }).then((res) => {
        if (res.ok) {
          // Notify all open tabs that fresh data is available
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETE' }))
          })
        }
      })
    )
  }
})

// Daily Reminder Notifications
// Settings are read from clients via message; persisted in localStorage on the page side.
let reminderTimer = null

function checkReminder() {
  // Read reminder config passed from the page
  if (!self.__reminderEnabled) return
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)

  // Already reminded today?
  if (self.__lastReminderDate === todayKey) return

  const [targetH, targetM] = (self.__reminderTime || '07:00').split(':').map(Number)
  if (now.getHours() > targetH || (now.getHours() === targetH && now.getMinutes() >= targetM)) {
    self.__lastReminderDate = todayKey
    self.registration.showNotification('Training Status', {
      body: 'Time to check in! Review your training metrics.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'daily-reminder',
      renotify: false,
    })
  }
}

function startReminderLoop() {
  if (reminderTimer) clearInterval(reminderTimer)
  reminderTimer = setInterval(checkReminder, 60_000) // check every minute
  checkReminder() // check immediately
}

// Receive settings from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REMINDER_SETTINGS') {
    self.__reminderEnabled = event.data.enabled
    self.__reminderTime = event.data.time
    if (event.data.enabled) {
      startReminderLoop()
    } else if (reminderTimer) {
      clearInterval(reminderTimer)
      reminderTimer = null
    }
  }
})

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
