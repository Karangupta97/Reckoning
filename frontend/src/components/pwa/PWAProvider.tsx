"use client";

import { useEffect } from "react";

/**
 * PWA Provider — registers background sync and push notification support.
 * Should be placed once in the citizen layout.
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register for background sync when SW is ready
    navigator.serviceWorker.ready.then(async (registration) => {
      // Request notification permission (non-blocking)
      if ("Notification" in window && Notification.permission === "default") {
        // We don't await — let user interact first
        // Permission will be requested when they opt in via settings
      }

      // Register periodic background sync if supported
      if ("periodicSync" in registration) {
        try {
          const status = await navigator.permissions.query({
            name: "periodic-background-sync" as PermissionName,
          });
          if (status.state === "granted") {
            await (registration as unknown as { periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> } }).periodicSync.register("sync-reports", {
              minInterval: 60 * 60 * 1000, // 1 hour
            });
          }
        } catch {
          // Periodic sync not supported — fine, we'll rely on online events
        }
      }
    });

    // Trigger sync when coming back online
    const handleOnline = async () => {
      const registration = await navigator.serviceWorker.ready;
      if ("sync" in registration) {
        try {
          await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-offline-reports");
        } catch {
          // Background Sync not supported — we'll manual sync from the app
        }
      }
      // Also dispatch a custom event for the app to react
      window.dispatchEvent(new CustomEvent("reckoning:online"));
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return <>{children}</>;
}
