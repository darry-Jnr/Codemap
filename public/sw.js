// CodeMap Service Worker v2
// Handles caching, offline support, and notifications

const CACHE_NAME = "codemap-v2"

const STATIC_ASSETS = [
  "/",
  "/home",
  "/share",
  "/find",
  "/friends",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  const networkOnly = [
    "firestore.googleapis.com",
    "firebase.googleapis.com",
    "openfreemap.org",
    "tiles.",
  ]
  if (networkOnly.some((d) => url.hostname.includes(d) || url.href.includes(d))) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached
          if (event.request.mode === "navigate") return caches.match("/home")
        })
      )
  )
})

// Tap notification → open app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const tag = event.notification.tag
  let url = "/home"
  if (tag === "arrival" || tag === "tracking") url = "/map"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})