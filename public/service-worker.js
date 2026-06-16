self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache static assets (JS bundles, CSS, images)
  if (
    (url.origin === self.location.origin && /\\.(js|css|png|webp|jpg|svg|woff2)$/.test(url.pathname)) ||
    url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(
      caches.open("tenime-assets-v1").then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return cached || new Response(null, { status: 504 });
        }
      })
    );
    return;
  }

  // Cache posters from our public cache directory
  if (url.pathname.startsWith("/cache/posters/")) {
    event.respondWith(
      caches.open("tenime-posters-v1").then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return cached || new Response(null, { status: 504 });
        }
      })
    );
    return;
  }

  // Navigation — use network-first for HTML
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((r) => r || new Response("Offline", { status: 503 }))
      )
    );
  }
});
