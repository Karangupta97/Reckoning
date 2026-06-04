/**
 * Custom service worker logic injected into the generated SW by @ducanh2912/next-pwa.
 *
 * Features:
 * - Background Sync for offline reports
 * - Push Notifications
 * - Skip Waiting on message
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Service Worker global — `webworker` lib types are not included in the
// project tsconfig (it uses `dom`), so we type `self` as `any`.
const sw = self as any;

// ─── Skip Waiting ──────────────────────────────────────────────────────────────

sw.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    sw.skipWaiting();
  }
});

// ─── Background Sync ───────────────────────────────────────────────────────────

// Background Sync API is not in standard TS DOM types — use `any` for the event.
sw.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-offline-reports") {
    event.waitUntil(syncOfflineReports());
  }
});

async function syncOfflineReports(): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction("offline-reports", "readonly");
    const store = tx.objectStore("offline-reports");
    const index = store.index("status");
    const request = index.getAll("pending");

    const reports: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      latitude: number;
      longitude: number;
      status: string;
    }> = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    let syncedCount = 0;

    for (const report of reports) {
      try {
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: report.title,
            description: report.description,
            category: report.category,
            latitude: report.latitude,
            longitude: report.longitude,
          }),
        });

        if (response.ok) {
          const updateTx = db.transaction("offline-reports", "readwrite");
          const updateStore = updateTx.objectStore("offline-reports");
          report.status = "synced";
          updateStore.put(report);
          syncedCount++;
        }
      } catch {
        // Will retry on next sync event
      }
    }

    if (syncedCount > 0) {
      await sw.registration.showNotification("Reckoning", {
        body: `${syncedCount} report${syncedCount !== 1 ? "s" : ""} synced successfully`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "sync-complete",
      });
    }
  } catch {
    // Will retry on next sync event
  }
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("reckoning-offline", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("offline-reports")) {
        const store = db.createObjectStore("offline-reports", { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("sync-queue")) {
        const store = db.createObjectStore("sync-queue", { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("type", "type");
        store.createIndex("createdAt", "createdAt");
      }
    };
  });
}

// ─── Push Notifications ────────────────────────────────────────────────────────

sw.addEventListener("push", (event: any) => {
  if (!event.data) return;

  let data: {
    title?: string;
    body?: string;
    icon?: string;
    tag?: string;
    url?: string;
    actions?: any[];
  };

  try {
    data = event.data.json();
  } catch {
    data = {
      title: "Reckoning",
      body: event.data.text(),
      icon: "/icon-192.png",
    };
  }

  const options: any = {
    body: data.body || "New notification",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "reckoning-push",
    data: { url: data.url || "/notifications" },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    sw.registration.showNotification(data.title || "Reckoning", options)
  );
});

// Handle notification click
sw.addEventListener("notificationclick", (event: any) => {
  event.notification.close();

  const url = (event.notification.data?.url as string) || "/dashboard";

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients: any[]) => {
        for (const client of clients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(url);
        }
      })
  );
});

// ─── Periodic Background Sync ──────────────────────────────────────────────────

sw.addEventListener("periodicsync", (event: any) => {
  if (event.tag === "sync-reports") {
    event.waitUntil(syncOfflineReports());
  }
});

export {};
