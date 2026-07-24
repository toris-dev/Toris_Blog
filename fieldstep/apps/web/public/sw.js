const CACHE_VERSION = "fieldstep-shell-v2";
const CORE_ASSETS = [
  "/offline.html",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/fonts/Pretendard-Regular.woff",
  "/fonts/Pretendard-SemiBold.woff",
];
const PRIVATE_TOKEN_PATHS = ["/approval", "/invite"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isPrivateTokenPath(pathname) {
  return PRIVATE_TOKEN_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shellCacheKey(url) {
  return new Request(`${url.origin}${url.pathname}`, { method: "GET" });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (isPrivateTokenPath(url.pathname)) {
      event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_VERSION).then((cache) => cache.put(shellCacheKey(url), copy)),
            );
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(shellCacheKey(url));
          return cached ?? caches.match("/offline.html");
        }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/images/") ||
    /\.(?:css|js|svg|png|webp|woff2?|otf)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              event.waitUntil(
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)),
              );
            }
            return response;
          }),
      ),
    );
  }
});
