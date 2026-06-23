"use client";

/**
 * usePushNotifications — hook that subscribes the authenticated citizen to
 * Web Push notifications on mount. Uses the VAPID public key from env.
 *
 * Behaviour:
 *   - Checks browser support for notifications + service workers.
 *   - Requests notification permission (if not already granted).
 *   - Subscribes via PushManager with the VAPID applicationServerKey.
 *   - POSTs the subscription to the backend.
 *   - Stores state in Zustand to avoid re-subscribing on every render.
 *
 * Call this inside the citizen dashboard layout so it runs once after login.
 */

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Whether the browser supports push notifications. */
function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/** Convert URL-safe base64 to Uint8Array (for applicationServerKey). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Convert ArrayBuffer to base64 string. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

// Module-level flag to prevent duplicate subscription attempts across re-renders.
let subscriptionAttempted = false;

export function usePushNotifications(): PushNotificationState {
  const { accessToken, hasHydrated } = useAuthStore();

  const isSupported = typeof window !== "undefined" && isPushSupported();
  const permission: NotificationPermission | "unsupported" = isSupported
    ? Notification.permission
    : "unsupported";

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !accessToken || !VAPID_PUBLIC_KEY) return false;

    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer as ArrayBuffer,
        });
      }

      const p256dh = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");
      if (!p256dh || !auth) return false;

      const res = await fetch(`${API_URL}/api/push/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dh),
            auth: arrayBufferToBase64(auth),
          },
        }),
      });

      return res.ok;
    } catch (error) {
      console.error("[usePushNotifications] Subscribe failed:", error);
      return false;
    }
  }, [isSupported, accessToken]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !accessToken) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return true;

      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Remove from backend
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      return true;
    } catch (error) {
      console.error("[usePushNotifications] Unsubscribe failed:", error);
      return false;
    }
  }, [isSupported, accessToken]);

  // Auto-subscribe on mount when user is authenticated.
  useEffect(() => {
    if (!hasHydrated || !accessToken || subscriptionAttempted) return;
    if (!isSupported || !VAPID_PUBLIC_KEY) return;

    // Skip if already subscribed this session.
    if (sessionStorage.getItem("reckoning-push-subscribed") === "true") return;

    subscriptionAttempted = true;
    subscribe().then((success) => {
      if (success) {
        sessionStorage.setItem("reckoning-push-subscribed", "true");
      }
    });
  }, [hasHydrated, accessToken, isSupported, subscribe]);

  return {
    isSupported,
    permission,
    isSubscribed:
      typeof window !== "undefined" &&
      sessionStorage?.getItem("reckoning-push-subscribed") === "true",
    subscribe,
    unsubscribe,
  };
}
