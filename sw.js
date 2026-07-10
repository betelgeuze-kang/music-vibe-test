// Cleanup-only service worker for removing the legacy cache-first PWA worker.
const LEGACY_CACHE_PREFIX = 'music-vibe-';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheKeys = await caches.keys();
        await Promise.all(
            cacheKeys
                .filter((key) => key.startsWith(LEGACY_CACHE_PREFIX))
                .map((key) => caches.delete(key))
        );

        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        await self.registration.unregister();

        // Reload controlled pages once so they receive the network version after cache removal.
        await Promise.all(clients.map((client) => client.navigate(client.url)));
    })());
});

// Intentionally no fetch handler: all requests use the normal network/cache stack.
