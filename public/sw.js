// Service Worker for LukenFit PWA
// v6: Minimal intervention - no caching, always network
const SW_VERSION = 'v6';

// Install - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${SW_VERSION}...`);
  self.skipWaiting();
});

// Activate - delete ALL caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${SW_VERSION}...`);
  event.waitUntil(
    (async () => {
      // Delete ALL caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      // Claim all clients immediately
      await self.clients.claim();
      // Notify all clients to refresh
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
      });
    })()
  );
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
