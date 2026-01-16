// Service Worker for LukenFit PWA
// Version bumped automatically with each deploy
const CACHE_NAME = 'lukenfit-v4';

// Only cache essential static assets
const STATIC_ASSETS = [
  '/favicon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install - cache only static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// Activate - clean ALL old caches immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch - NETWORK FIRST for everything except static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Skip Supabase requests entirely
  if (url.hostname.includes('supabase.co')) return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // For HTML/JS/CSS - ALWAYS go to network first
  const isAppResource = url.pathname === '/' || 
    url.pathname.endsWith('.html') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/assets/');

  if (isAppResource) {
    // Network first, no caching of app code
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only use cache as last resort for offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // For static assets (icons, etc) - cache first
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('/', '')))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
    return;
  }

  // Everything else - network only
  event.respondWith(fetch(event.request));
});

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
