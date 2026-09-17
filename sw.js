// ========================================
// Philosophy PWA - Service Worker
// ========================================

const CACHE_NAME = 'philosophy-pwa-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/data.js',
    '/js/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    console.log('[ServiceWorker] Fetch:', event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseClone = response.clone();
                
                // Open cache and store the response
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                
                return response;
            })
            .catch(() => {
                // If network fails, try to get from cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        
                        // If not in cache, return a fallback for HTML pages
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync:', event.tag);
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push:', event.data);
    
    const options = {
        body: event.data ? event.data.text() : 'New content available',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'explore', title: 'فتح التطبيق', icon: '/icons/icon-96.png' },
            { action: 'close', title: 'إغلاق', icon: '/icons/icon-96.png' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('تعلم الفلسفة مع فافا', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});