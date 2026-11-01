const CACHE_NAME = "roast-ritual-pos-v10";
const ASSETS = [
  "/",
  "/index.html",
  "/logo.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/qr-code.svg",
  "/qr-code.png",
  "/pos-mobile-qr-card.png",
  "/manifest.json",
  "/Images/classic%20cappuccino.webp",
  "/Images/Salted%20Caramel%20Macchiato.jpg",
  "/Images/Velvet%20Flat%20White.jpg"
];

// Install: pre-cache app shell and immediately skip waiting to take over
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: purge stale caches and claim all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => {
      // Notify all active mobile apps and browser tabs of the new update
      return self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SW_UPDATED", version: CACHE_NAME });
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch: network-first strategy so changes are immediately served, with offline cache fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // For HTML document navigation, always fetch fresh from network to get newest app code
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match("/index.html") || caches.match(event.request))
    );
    return;
  }

  // For other assets, network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Message listener for manual check, cache purge, or forced skipWaiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && (event.data.type === "PURGE_CACHE" || event.data.type === "PURGE_AND_UPDATE")) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
      self.skipWaiting();
    });
  }
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
});
