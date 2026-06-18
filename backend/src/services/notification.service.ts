/**
 * Push + SMS notification service.
 *
 * Escalation and SLA events must reach admins via push notification AND SMS.
 * RoadWatch AI does not yet ship a concrete push/SMS provider integration, so
 * this module provides a single, well-typed seam the rest of the app calls:
 *
 *   - {@link sendPushNotification} — deliver a titled push message.
 *   - {@link sendSms}              — deliver an SMS to an E.164 number.
 *
 * The default implementation logs (best-effort, never throws) so the
 * escalation workflow is fully wired end-to-end and observable in every
 * environment. Swap the bodies for FCM/APNs and SNS/Twilio when credentials
 * are available — the call sites and signatures will not change.
 */

/** A push notification to deliver to a single admin recipient. */
export interface PushMessage {
  /** Recipient admin id (maps to a device token in a real integration). */
  adminId: string;
  /** Short, bold title line. */
  title: string;
  /** Body text. */
  body: string;
  /** Optional structured payload for deep-linking (e.g. complaint id). */
  data?: Record<string, string>;
}

/**
 * Deliver a push notification (best-effort; never throws).
 *
 * @param message Recipient + title/body/data.
 * @returns Resolves when the delivery attempt completes.
 */
export async function sendPushNotification(message: PushMessage): Promise<void> {
  try {
    // TODO: integrate FCM / APNs. For now, log so the flow is observable.
    // eslint-disable-next-line no-console
    console.log(
      `[notification] PUSH → admin=${message.adminId} | ${message.title} — ${message.body}`,
    );
    await Promise.resolve();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[notification] Push delivery failed:", error);
  }
}

/**
 * Deliver an SMS message (best-effort; never throws).
 *
 * @param phone E.164 recipient number (e.g. `+919876543210`); may be null.
 * @param body  Message text.
 * @returns Resolves when the delivery attempt completes.
 */
export async function sendSms(phone: string | null, body: string): Promise<void> {
  if (!phone) {
    // eslint-disable-next-line no-console
    console.warn("[notification] SMS skipped — no phone number on file.");
    return;
  }
  try {
    // TODO: integrate SNS / Twilio. For now, log so the flow is observable.
    // eslint-disable-next-line no-console
    console.log(`[notification] SMS → ${phone} — ${body}`);
    await Promise.resolve();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[notification] SMS delivery failed:", error);
  }
}
