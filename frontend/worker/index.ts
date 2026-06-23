/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

/**
 * Custom service worker logic — merged into the auto-generated Workbox SW
 * by @ducanh2912/next-pwa (via `customWorkerSrc: "worker"`).
 *
 * Handles incoming Web Push notifications and click events.
 */

// ─── Push Event ─────────────────────────────────────────────────────────────
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json() as {
      title?: string;
      body?: string;
      icon?: string;
      badge?: string;
      url?: string;
      tag?: string;
      data?: Record<string, string>;
    };

    const title = payload.title ?? "Reckoning";
    const options: NotificationOptions = {
      body: payload.body ?? "You have a new notification.",
      icon: payload.icon ?? "/android-chrome-192x192.png",
      badge: payload.badge ?? "/android-chrome-192x192.png",
      tag: payload.tag ?? "reckoning-notification",
      vibrate: [200, 100, 200],
      data: {
        url: payload.url ?? "/dashboard/my-reports",
        ...payload.data,
      },
      actions: [
        { action: "open", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Fallback for non-JSON push payloads.
    const text = event.data?.text() ?? "You have a new notification.";
    event.waitUntil(
      self.registration.showNotification("Reckoning", { body: text }),
    );
  }
});

// ─── Notification Click ─────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = (event.notification.data?.url as string) ?? "/dashboard/my-reports";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if open.
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab.
        return self.clients.openWindow(url);
      }),
  );
});
