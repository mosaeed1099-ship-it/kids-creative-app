/**
 * sw.js — offline cache + fast navigation for Kids Creative Studio.
 *
 * The app is native ES modules (no bundler), so a single navigation fetches
 * dozens of small files. Without caching, Cloudflare's default
 * `max-age=0, must-revalidate` forces a network round-trip per file on EVERY
 * navigation (~250ms each) → slow page switches. This worker caches everything
 * on first use and serves it instantly afterward, and makes the app fully
 * offline.
 *
 * Correctness on deploy: the cache name embeds the build version (injected by
 * tools/build.mjs), and the cache is populated with `cache: 'reload'` so it
 * bypasses the HTTP disk cache and always stores the FRESH build for this
 * version. A new release changes this file → new worker → new cache → old
 * caches purged → users get the fresh build (no stale modules).
 */
const VERSION = '__BUILD_VERSION__';
const CACHE = `kcs-${VERSION}`;
const SHELL = ['./', './index.html', './manifest.webmanifest', './VERSION'];
const ASSET_RE = /\.(?:js|css|json|svg|png|jpe?g|webp|gif|woff2?|ico|mp3|wav)$/i;

// Fetch straight from the network, bypassing the browser HTTP cache, so the
// version cache never captures a stale (previously HTTP-cached) response.
const fresh = (url) => fetch(new Request(url, { cache: 'reload' }));

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) =>
    Promise.all(SHELL.map((u) => fresh(u).then((r) => r.ok && c.put(u, r)).catch(() => {})))));
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

  // App navigations → serve the cached shell (hash-routed SPA); refresh if missing.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('./index.html');
      if (cached) return cached;
      const res = await fresh('./index.html').catch(() => null);
      if (res && res.ok) cache.put('./index.html', res.clone());
      return res || Response.error();
    })());
    return;
  }

  // Static assets → cache-first (instant + offline), populate fresh per version.
  if (ASSET_RE.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fresh(req.url).catch(() => null);
      if (res && res.ok) cache.put(req, res.clone());
      return res || fetch(req);
    })());
  }
});
