/* Sai Sandesh service worker.
   App shell cached on install; devotional JSON, topic JSON, and card PNGs
   cached at runtime so previously-viewed days re-read offline. */
"use strict";

const VERSION = "sai-sandesh-v4";
const SHELL = [
  "/",
  "/static/index.html",
  "/static/styles.css",
  "/static/app.js",
  "/static/manifest.webmanifest",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
];

const RUNTIME_RE = /^\/(api|api\/v1)\/(today|day\/\d{4}-\d{2}-\d{2}|topics|topic\/[a-z0-9-]+|archive)$/;
const CARD_RE = /^\/cards\//;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Runtime cache: API JSON + card PNGs — network first, cache fallback.
  if (RUNTIME_RE.test(url.pathname) || CARD_RE.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache first, network fallback.
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
