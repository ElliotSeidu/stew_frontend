import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

// Activate a new service worker immediately instead of waiting for every tab to close.
// Without skipWaiting the installed app can keep serving a previous build from cache for
// days, which makes new features look missing.
self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api/] }))

// Web Push: payload from your backend: { title, body, url, tag }
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data?.text() } }
  event.waitUntil(
    self.registration.showNotification(data.title || 'STEW', {
      body: data.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: data.tag || 'stew',
      data: { url: data.url || '/app/orders' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/app'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes('/app') && 'focus' in c) { c.navigate(url); return c.focus() }
      }
      return self.clients.openWindow(url)
    }),
  )
})
