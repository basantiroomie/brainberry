// Check if we're in a service worker context
if (typeof self !== 'undefined' && 'caches' in self) {
  const CACHE_NAME = 'brainberry-v1'
  const urlsToCache = [
    '/',
    '/BrainBerrylogo.png',
    '/landingpage.jpg',
    '/therapy-gaming-tablet.png',
    '/diverse-children-educational-games.png'
  ]

  // Install event - cache resources
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(urlsToCache)
        })
        .catch((error) => {
          console.log('Cache install failed:', error)
        })
    )
  })

  // Fetch event - serve from cache when offline
  self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
      return
    }

    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request)
        })
        .catch((error) => {
          console.log('Fetch failed:', error)
          // Return a fallback response if needed
          return new Response('Offline', { status: 503 })
        })
    )
  })

  // Activate event - clean up old caches
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
    )
  })
}