/**
 * Service Worker - Cache Management
 * Caches critical assets and enables offline support
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `portfolio-cache-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/components.css',
    '/css/animations.css',
    '/js/main.js',
    '/js/config.js',
    '/js/i18n.js',
    '/js/app.js',
    '/assets/logo.svg',
    '/assets/og-image.svg',
    '/assets/structured-data.json'
];

/**
 * Install event - precache critical assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        }).catch((err) => {
            console.warn('Precache failed:', err);
        })
    );
    self.skipWaiting();
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external origins (except CDN & APIs)
    if (url.origin !== location.origin) {
        if (!isAllowedExternalOrigin(url.origin)) {
            return;
        }
    }

    // Network first for API calls
    if (url.pathname.includes('/api/') || url.hostname.includes('api.')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Cache first for static assets
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Stale-while-revalidate for HTML
    event.respondWith(staleWhileRevalidate(request));
});

/**
 * Fetch strategies
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('Fetch failed:', error);
        return new Response('Offline - Resource not available', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return new Response('Request failed and not cached', { status: 503 });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached || new Response('Offline', { status: 503 }));

    return cached || fetchPromise;
}

/**
 * Helper functions
 */
function isStaticAsset(pathname) {
    return /\.(js|css|svg|woff2|png|webp|gif|ico)$/i.test(pathname);
}

function isAllowedExternalOrigin(origin) {
    const allowed = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
        'https://api.github.com',
        'https://opengraph.githubassets.com'
    ];
    return allowed.some((url) => origin.includes(new URL(url).hostname));
}
