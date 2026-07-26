/**
 * Service worker — receives push messages and opens the app when tapped.
 *
 * Plain JS, served as-is from /sw.js. It is not part of the bundle: a service
 * worker has to be a separate top-level file for its scope to cover the site.
 */

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'Coming up', body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Coming up', {
      body: payload.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      // Collapses repeats for the same milestone rather than stacking them.
      tag: payload.milestoneId || 'milestone',
      data: { milestoneId: payload.milestoneId },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const open = clients.find((client) => client.url.startsWith(self.registration.scope))
      if (open) {
        await open.focus()
        return
      }
      await self.clients.openWindow('/')
    })(),
  )
})
