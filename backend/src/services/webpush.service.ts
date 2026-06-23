/**
 * Web Push notification service.
 *
 * Uses the Web Push protocol (VAPID) to deliver real-time browser
 * notifications to citizens. Subscriptions are stored per-device in
 * the `push_subscriptions` table.
 *
 * When VAPID keys are not configured the service degrades gracefully
 * (logs + no-ops) so the rest of the app is unaffected.
 */

import webpush from "web-push";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

/** Whether Web Push is configured and ready. */
export const webPushEnabled: boolean = Boolean(
  env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY,
);

// Configure VAPID credentials once at module load.
if (webPushEnabled) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY!,
    env.VAPID_PRIVATE_KEY!,
  );
  // eslint-disable-next-line no-console
  console.log("[webpush] VAPID configured — push notifications enabled.");
} else {
  // eslint-disable-next-line no-console
  console.warn("[webpush] VAPID keys not set — push notifications disabled.");
}

/** Payload shape sent to the browser service worker. */
export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification to all subscribed devices of a user.
 *
 * Automatically removes stale/expired subscriptions (410 Gone).
 *
 * @param userId The citizen user id.
 * @param payload Notification content.
 * @returns Number of successfully delivered notifications.
 */
export async function sendWebPushToUser(
  userId: string,
  payload: WebPushPayload,
): Promise<number> {
  if (!webPushEnabled) {
    // eslint-disable-next-line no-console
    console.log(`[webpush] Skipped (not configured) — user=${userId}, title="${payload.title}"`);
    return 0;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`[webpush] No subscriptions for user=${userId}`);
    return 0;
  }

  const payloadStr = JSON.stringify(payload);
  let delivered = 0;
  const staleIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr,
        );
        delivered += 1;
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or unsubscribed — mark for cleanup.
          staleIds.push(sub.id);
        } else {
          // eslint-disable-next-line no-console
          console.error(
            `[webpush] Failed to push to endpoint=${sub.endpoint.slice(0, 60)}…:`,
            error,
          );
        }
      }
    }),
  );

  // Clean up stale subscriptions.
  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: staleIds } },
    });
    // eslint-disable-next-line no-console
    console.log(`[webpush] Removed ${staleIds.length} stale subscription(s) for user=${userId}`);
  }

  // eslint-disable-next-line no-console
  console.log(`[webpush] Delivered ${delivered}/${subscriptions.length} to user=${userId}`);
  return delivered;
}
