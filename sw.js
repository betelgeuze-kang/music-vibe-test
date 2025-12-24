const CACHE_NAME = 'music-vibe-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './lang.js',
    './questions.js',
    './results.js',
    './logic.js',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest',
    'https://html2canvas.hertzen.com/dist/html2canvas.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
