/* FlyBridge push notification service worker.
 * Handles incoming Web Push payloads and shows Chrome notifications that
 * deep-link back into the site. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const defaults = {
    title: "FlyBridge",
    body: "",
    url: "/dashboard/notifications",
    icon: "/transparent-logo-dark.png",
    badge: "/transparent-logo-dark.png",
    tag: "",
  };
  let data = defaults;
  try {
    if (event.data) data = { ...defaults, ...event.data.json() };
  } catch {
    data = defaults;
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    vibrate: [120, 60, 120],
    data: { url: data.url },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/dashboard/notifications";

  event.waitUntil(
    (async () => {
      const target = new URL(url, self.location.origin).toString();
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const existing = allClients.find(
        (client) =>
          client.visibilityState === "visible" &&
          new URL(client.url).origin === self.location.origin &&
          new URL(client.url).pathname === new URL(target).pathname,
      );
      if (existing) {
        await existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })(),
  );
});
