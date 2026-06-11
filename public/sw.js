// Service Worker for LukenFit PWA
// v7: Safe caching for instant cold starts.
// - Hashed /assets/ files are immutable → cache-first
// - Navigations are network-first with a 4s timeout, falling back to the
//   last cached app shell so the PWA opens instantly even on a flaky radio
const SW_VERSION = 'v7';
const RUNTIME_CACHE = `lukenfit-runtime-${SW_VERSION}`;
const SHELL_KEY = '/__app-shell__';
const NAV_TIMEOUT_MS = 4000;

// Install - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${SW_VERSION}...`);
  self.skipWaiting();
});

// Activate - delete old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${SW_VERSION}...`);
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);
          })
      );
      await self.clients.claim();
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
      });
    })()
  );
});

const OFFLINE_HTML =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>LukenFit - Offline</title></head>' +
  '<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;margin:0">' +
  '<div style="text-align:center"><h1>📱 Sin conexión</h1><p>Verifica tu internet y recarga</p></div></body></html>';

async function handleNavigation(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const network = fetch(request);
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('nav-timeout')), NAV_TIMEOUT_MS)
    );
    const response = await Promise.race([network, timeout]);
    if (response && response.ok) {
      cache.put(SHELL_KEY, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(SHELL_KEY);
    if (cached) {
      console.warn('[SW] Navigation fell back to cached app shell:', err.message);
      return cached;
    }
    return new Response(OFFLINE_HTML, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

async function handleAsset(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  const url = new URL(request.url);
  // Vite emits content-hashed filenames under /assets/ → safe to cache forever
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(handleAsset(request));
  }
  // Everything else (API, Supabase, fonts, etc.) goes straight to network
});

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Notification click - focus an existing window or open a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })()
  );
});
