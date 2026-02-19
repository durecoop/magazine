const CACHE_NAME = 'teamchat-v1';
const PRECACHE = [
  '/magazine/report/',
  '/magazine/report/index.html',
  '/magazine/report/manifest.json',
  '/magazine/report/icon-192.png'
];

// Install: cache shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip non-GET and API calls
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// Push notification received
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  const options = {
    body: data.body || '',
    icon: data.icon || '/magazine/report/icon-192.png',
    badge: data.badge || '/magazine/report/icon-72.png',
    tag: data.tag || 'chat',
    renotify: true,
    vibrate: [200, 100, 200],
    data: data.data || {}
  };
  e.waitUntil(self.registration.showNotification(data.title || '팀장방', options));
});

// Notification click: open/focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const existing = wins.find(w => w.url.includes('/magazine/report/'));
      if (existing) { return existing.focus(); }
      return clients.openWindow('/magazine/report/');
    })
  );
});
