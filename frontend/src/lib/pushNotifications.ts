/**
 * Web Push subscription management for the citizen frontend.
 *
 * Provides functions to:
 *   - Check if push is supported and permission state
 *   - Request notification permission
 *   - Subscribe to push notifications (registers with backend)
 *   - Unsubscribe from push notifications
 *
 * The VAPID public key is fetched from the backend at runtime so it doesn't
 * need to be duplicated in frontend env vars.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Whether the browser supports push notifications. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Current notification permission state. */
export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Fetch the VAPID public key from the backend.
 */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/push/vapid-key`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.publicKey ?? null;
  } catch {
    console.error("[push] Failed to fetch VAPID key");
    return null;
  }
}

/**
 * Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey).
 */
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

/**
 * Subscribe the user to push notifications.
 *
 * 1. Requests notification permission (if not already granted).
 * 2. Gets the service worker registration.
 * 3. Subscribes to push via the Push API.
 * 4. Sends the subscription to the backend.
 *
 * @param accessToken The citizen's JWT access token for authenticating with the backend.
 * @returns `true` if subscription succeeded, `false` otherwise.
 */
export async function subscribeToPush(accessToken: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn("[push] Push not supported in this browser");
    return false;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("[push] Notification permission denied");
    return false;
  }

  try {
    // Get VAPID key
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      console.error("[push] No VAPID key available");
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      const appServerKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });
    }

    // Send subscription to backend
    const res = await fetch(`${API_URL}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(subscription.getKey("auth")!),
        },
      }),
    });

    if (!res.ok) {
      console.error("[push] Backend rejected subscription:", await res.text());
      return false;
    }

    console.log("[push] Successfully subscribed to push notifications");
    return true;
  } catch (error) {
    console.error("[push] Subscription failed:", error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications.
 *
 * @param accessToken The citizen's JWT access token.
 */
export async function unsubscribeFromPush(accessToken: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true; // Already unsubscribed

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

    console.log("[push] Successfully unsubscribed from push notifications");
    return true;
  } catch (error) {
    console.error("[push] Unsubscribe failed:", error);
    return false;
  }
}

/** Convert an ArrayBuffer to a base64 string. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
