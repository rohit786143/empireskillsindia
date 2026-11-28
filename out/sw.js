const CACHE_NAME = "esi-pwa-v1";
const PRECACHE_URLS = [
  "/offline.html",
  "/empire-logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache PHP API calls or cross-origin requests so live data & auth sessions stay 100% fresh
  if (url.origin !== self.location.origin || url.pathname.startsWith("/php-api/")) {
    return;
  }

  // Network-first for HTML page navigations with branded offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Network-first with cache fallback for static icons & images
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/empire-logo.png" ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
