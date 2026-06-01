/**
 * ElasticEmail transactional-email service.
 *
 * Thin wrapper around the ElasticEmail REST API used to deliver OTP emails.
 * The client is initialised once from validated env vars. On any failure the
 * full error is logged server-side and a generic {@link AppError} is thrown,
 * so ElasticEmail internals (auth keys, payloads, provider messages) never reach
 * the API response.
 */

import axios from "axios";
import { URLSearchParams } from "url";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { otpEmailTemplate } from "../templates/otpEmail.js";

/** ElasticEmail API endpoint */
const ELASTICEMAIL_API_URL = "https://api.elasticemail.com/v2/email/send";

/**
 * Send a RoadWatch AI verification (OTP) email.
 *
 * The OTP is embedded in the rendered HTML and the subject line but is never
 * logged by this function. Errors are logged in full server-side and surfaced
 * to callers as a sanitised {@link AppError}.
 *
 * @param to      Recipient email address.
 * @param name    Recipient display name (used in the greeting).
 * @param otp     6-digit verification code.
 * @param country BIMSTEC country code (selects the greeting flag).
 * @returns Resolves once ElasticEmail accepts the message for delivery.
 * @throws {AppError} 502 when ElasticEmail rejects or fails to accept the message.
 */
export async function sendOtpEmail(
  to: string,
  name: string,
  otp: string,
  country: string,
): Promise<void> {
  const html = otpEmailTemplate(otp, name, country);

  try {
    const params = new URLSearchParams({
      apikey: env.ELASTICEMAIL_API_KEY,
      from: env.ELASTICEMAIL_FROM_EMAIL,
      fromName: env.ELASTICEMAIL_FROM_NAME,
      to: to,
      subject: `Your RoadWatch Verification Code — ${otp} (10 min)`,
      html: html,
      bodyText:
        `Hi ${name},\n\n` +
        `Your RoadWatch AI verification code is: ${otp}\n` +
        `This code expires in 10 minutes.\n\n` +
        `If you didn't request this, ignore this email.\n\n` +
        `RoadWatch AI | Road Safety Hackathon 2026 - BIMSTEC`,
      displayName: name,
      msgTo: to,
      msgCC: "",
      msgBcc: "",
    });

    const response = await axios.post(ELASTICEMAIL_API_URL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // ElasticEmail returns 200 with success status on success
    const body = response.data as ElasticEmailSendResult;
    if (body?.success !== true && body?.status !== "ok") {
      throw new AppError("Email delivery was not accepted by the provider.", 502, {
        cause: body,
      });
    }
  } catch (error) {
    // Log the FULL error server-side for diagnostics (may contain provider
    // payloads); never expose it to the API consumer.
    // eslint-disable-next-line no-console
    console.error("[elasticemail] Failed to send OTP email:", error);

    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to send verification email. Please try again shortly.",
      502,
      { cause: error },
    );
  }
}

/** Minimal shape of the ElasticEmail send response we rely on. */
interface ElasticEmailSendResult {
  success?: boolean;
  status?: string;
  messageid?: string;
  transactionid?: string;
}
