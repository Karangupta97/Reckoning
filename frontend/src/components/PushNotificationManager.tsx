"use client";

/**
 * PushNotificationManager — mounts in citizen dashboard layout to
 * auto-subscribe the logged-in citizen to Web Push notifications.
 *
 * Delegates all logic to the `usePushNotifications` hook.
 * Renders nothing — invisible component.
 */

import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationManager() {
  // The hook auto-subscribes on mount when user is authenticated.
  usePushNotifications();
  return null;
}
