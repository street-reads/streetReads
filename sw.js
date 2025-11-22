/* Street Reads Service Worker */
const VERSION = 'sr-v1.0.1';
const STATIC_CACHE = `static-${VERSION}`;

const ONLINE_PROBE = '/__online.txt'; // do NOT precache this

const APP_SHELL = [
    '/',
    '/index.html',
    '/offline.html',
    // CSS
    '/css/style.css',
    '/css/bookBoxDetail.css',
    '/css/homepage.css',
    '/css/user-profile.css',
    '/css/register.css',
    '/css/login.css',
    // JS
    '/js/app.js',
    '/js/bookBoxDetail.js',
    '/js/cloudinary-config.js',
    '/js/firebase-config.js',
    '/js/homepage.js',
    '/js/image-upload.js',
    '/js/login.js',
    '/js/register.js',
    '/js/update-navbar-avatar.js',
    '/js/user-profile.js',
    // Web components
    '/components/app-navbar.js',
    // Pages
    '/pages/homepage.html',
    '/pages/login.html',
    '/pages/register.html',
    '/pages/user-profile.html',
    '/pages/bookBoxDetail.html',
    //src
    '/src/avatar.png',
    '/src/location_pin.png',
    '/src/206f9b18760fe54ba2f732f01f4ef6fb06e2774e.png',
    '/src/0416f2714b3089cc44ed528f4660a254f40afa73.png',
    // PWA
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.filter((k) => k.startsWith('static-') && k !== STATIC_CACHE).map((k) => caches.delete(k)));
            await self.clients.claim();
        })()
    );
});

// Helper to create a cache-busted, network-only Request
function bust(urlLike) {
    const u = new URL(urlLike, self.location.origin);
    u.searchParams.set('t', Date.now().toString());
    return new Request(u.toString(), {
        cache: 'no-store',
        redirect: 'follow',
        credentials: 'omit',
        headers: { 'Cache-Control': 'no-store' },
    });
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // 1) ONLINE PROBE -> always network (no cache). Any response type (200/404/500)
    // indicates we're online; only network/timeout errors imply offline.
    if (url.origin === self.location.origin && url.pathname === ONLINE_PROBE) {
        event.respondWith(fetch(bust(ONLINE_PROBE)));
        return;
    }

    // 2) HTML navigations -> network-first, fallback to cache, then offline.html
    if (req.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const fresh = await fetch(req);
                    const cache = await caches.open(STATIC_CACHE);
                    cache.put(req, fresh.clone());
                    return fresh;
                } catch {
                    const cache = await caches.open(STATIC_CACHE);
                    const cached = await cache.match(req);
                    return cached || cache.match('/offline.html');
                }
            })()
        );
        return;
    }

    // 3) Static assets (same-origin) -> cache-first, then network
    const isAsset =
        req.destination === 'style' ||
        req.destination === 'script' ||
        req.destination === 'image' ||
        req.destination === 'font' ||
        url.pathname.endsWith('.webmanifest');

    if (isAsset && url.origin === self.location.origin) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(req);
                if (cached) return cached;
                try {
                    const fresh = await fetch(req);
                    cache.put(req, fresh.clone());
                    return fresh;
                } catch {
                    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
                }
            })()
        );
        return;
    }

    // 4) Everything else -> network passthrough
});
