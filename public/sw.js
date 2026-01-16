// Service Worker for LukenFit PWA
// Minimal caching - only icons, always network-first for code
const CACHE_NAME = 'lukenfit-v5';

// Install - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v5...');
  self.skipWaiting();
});

// Activate - delete ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v5...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - ALWAYS network first, minimal intervention
self.addEventListener('fetch', (event) => {
  // Skip everything - let browser handle normally
  // Only intercept for offline fallback on navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>LukenFit - Offline</title></head>' +
          '<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;margin:0">' +
          '<div style="text-align:center"><h1>📱 Sin conexión</h1><p>Verifica tu internet y recarga</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
  }
  // For all other requests, don't intercept - let them go to network normally
});

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
