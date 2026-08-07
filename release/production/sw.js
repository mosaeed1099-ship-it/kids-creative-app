/**
 * sw.js — offline cache + fast navigation for Kids Creative Studio.
 *
 * The app is native ES modules (no bundler), so a single navigation fetches
 * dozens of small files. Without caching, Cloudflare's default
 * `max-age=0, must-revalidate` forces a network round-trip per file on EVERY
 * navigation (~250ms each) → slow page switches. This worker caches everything
 * on first use and serves it instantly afterward (stale-while-revalidate), and
 * makes the app work fully offline.
 *
 * Correctness on deploy: the cache name embeds the build version (injected by
 * tools/build.mjs). A new release changes this file → the browser installs a new
 * worker → old caches are purged → users get the fresh build.
 */
const VERSION = '1.4.0';
const CACHE = `kcs-${VERSION}`;
const SHELL = ['./', './index.html', './manifest.webmanifest', './VERSION'];
const ASSET_RE = /\.(?:js|css|json|svg|png|jpe?g|webp|gif|woff2?|ico|mp3|wav)$/i;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('kcs-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // App navigations → serve the cached shell (hash-routed SPA), refresh in bg.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('./index.html');
      const net = fetch(req).then((r) => { if (r.ok) cache.put('./index.html', r.clone()); return r; }).catch(() => cached);
      return cached || net;
    })());
    return;
  }

  // Static assets → stale-while-revalidate (instant from cache, update in bg).
  if (ASSET_RE.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const net = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => cached);
      return cached || net;
    })());
  }
});
