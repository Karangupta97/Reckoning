/**
 * Transactional email service — Amazon SES over Nodemailer SMTP.
 *
 * Responsibilities:
 *   - Own a single, lazily-created Nodemailer transporter (singleton) built
 *     from validated SMTP config — credentials are referenced by key only and
 *     never logged.
 *   - Verify the SMTP connection on startup ({@link verifyEmailTransport}).
 *   - Send each transactional message with bounded exponential-backoff retries,
 *     recipient validation, and structured server-side logging.
 *   - Expose intent-revealing send functions the rest of the app calls:
 *       {@link sendVerificationEmail}, {@link sendPasswordResetEmail},
 *       {@link sendWelcomeEmail}, {@link sendComplaintReceivedEmail},
 *       {@link sendAdminNotificationEmail}.
 *
 * On terminal failure a sanitised {@link AppError} (502) is thrown so SMTP/SES
 * internals never reach the API consumer. Callers that treat email as a
 * non-critical side effect (e.g. the welcome email, background workers) should
 * catch and log instead of propagating.
 */

import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool/index.js";
import { isProduction } from "../config/env.js";
import {
  smtpConfig,
  emailFrom,
  emailFromAddress,
  adminEmail,
  retryConfig,
  emailDebug,
} from "../config/email.config.js";
import { AppError } from "../utils/AppError.js";
import {
  verificationTemplate,
  type RenderedEmail,
} from "../templates/verification.template.js";
import { resetPasswordTemplate } from "../templates/resetPassword.template.js";
import { welcomeTemplate } from "../templates/welcome.template.js";
import { complaintReceivedTemplate } from "../templates/complaintReceived.template.js";
import { adminNotificationTemplate } from "../templates/adminNotification.template.js";
import { districtInviteEmailTemplate } from "../templates/districtInviteEmail.js";
import { subDistrictInviteEmailTemplate } from "../templates/subDistrictInviteEmail.js";

/** RFC-5322-lite email check — defensive, not a full parser. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Module-level singleton transporter (created on first use). */
let transporter: Transporter | null = null;

/**
 * Lazily create (once) and return the shared SES SMTP transporter.
 *
 * The transporter is pooled and reused across the process lifetime so we don't
 * pay TLS-handshake cost per message and stay within SES connection limits.
 *
 * @returns The singleton {@link Transporter}.
 */
export function getTransporter(): Transporter {
  if (transporter) return transporter;

  const options: SMTPPool.Options = {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    requireTLS: smtpConfig.requireTLS,
    auth: smtpConfig.auth,
    pool: smtpConfig.pool,
    maxConnections: smtpConfig.maxConnections,
    maxMessages: smtpConfig.maxMessages,
    connectionTimeout: smtpConfig.connectionTimeout,
    greetingTimeout: smtpConfig.greetingTimeout,
    socketTimeout: smtpConfig.socketTimeout,
    // Verbose SMTP logging only outside production (logger expects `true`).
    ...(emailDebug ? { logger: true as const, debug: true } : {}),
  };

  transporter = nodemailer.createTransport(options);

  return transporter;
}

/**
 * Verify SMTP connectivity + credentials against SES.
 *
 * Call once during startup. Returns `false` (and logs) on failure rather than
 * throwing, so the operator can decide whether unreachable email should abort
 * boot. Never logs the SMTP password.
 *
 * @returns `true` when the transport is ready, `false` otherwise.
 */
export async function verifyEmailTransport(): Promise<boolean> {
  try {
    await getTransporter().verify();
    // eslint-disable-next-line no-console
    console.log(
      `[email.service] SMTP transport ready (host=${smtpConfig.host}, port=${smtpConfig.port}, secure=${smtpConfig.secure}).`,
    );
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[email.service] SMTP verification failed — emails will not send until this is resolved:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Validate a recipient email address (defensive — callers should also validate
 * upstream via Zod).
 *
 * @param email Candidate address.
 * @throws {AppError} 400 INVALID_RECIPIENT when the address is malformed.
 */
function assertValidRecipient(email: string): void {
  if (!EMAIL_RE.test(email)) {
    throw new AppError("Invalid recipient email address.", 400, {
      code: "INVALID_RECIPIENT",
    });
  }
}

/** Sleep for `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Compute the backoff delay (capped) before a given retry attempt. */
function backoffDelay(attempt: number): number {
  const exp = retryConfig.baseDelayMs * 2 ** (attempt - 1);
  return Math.min(exp, retryConfig.maxDelayMs);
}

/** Internal payload for {@link dispatch}. */
interface DispatchInput {
  to: string;
  rendered: RenderedEmail;
  /** Short label used in logs to identify the email kind. */
  kind: string;
}

/**
 * Send one rendered email with bounded exponential-backoff retries.
 *
 * Retries transient failures up to {@link retryConfig.maxAttempts} times. On
 * final failure the full error is logged server-side and a sanitised
 * {@link AppError} is thrown — provider internals never reach the client.
 *
 * @param input Recipient, rendered subject/html/text, and a log label.
 * @returns The provider message id on success.
 * @throws {AppError} 502 EMAIL_SEND_FAILED after exhausting retries.
 */
async function dispatch({ to, rendered, kind }: DispatchInput): Promise<string> {
  assertValidRecipient(to);

  const message: SendMailOptions = {
    from: emailFrom,
    to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    replyTo: emailFromAddress,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt += 1) {
    try {
      const info = await getTransporter().sendMail(message);
      // eslint-disable-next-line no-console
      console.log(
        `[email.service] Sent '${kind}' to ${redact(to)} (messageId=${info.messageId}, attempt=${attempt}).`,
      );
      return info.messageId;
    } catch (error) {
      lastError = error;
      // eslint-disable-next-line no-console
      console.error(
        `[email.service] Attempt ${attempt}/${retryConfig.maxAttempts} to send '${kind}' to ${redact(to)} failed:`,
        error instanceof Error ? error.message : error,
      );
      if (attempt < retryConfig.maxAttempts) {
        await delay(backoffDelay(attempt));
      }
    }
  }

  throw new AppError(
    "Failed to send email. Please try again shortly.",
    502,
    { code: "EMAIL_SEND_FAILED", cause: lastError },
  );
}

/**
 * Partially mask an email address for logs (keeps PII out of log aggregators).
 *
 * @param email Address to redact.
 * @returns e.g. `j***@example.com`.
 */
function redact(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

// ---------------------------------------------------------------------------
// Public send functions
// ---------------------------------------------------------------------------

/**
 * Send the sign-up OTP verification email.
 *
 * @param to       Recipient email.
 * @param fullName Recipient display name.
 * @param otp      6-digit verification code.
 * @param country  BIMSTEC country code (greeting flag).
 * @returns The provider message id.
 * @throws {AppError} 400 invalid recipient / 502 on send failure.
 */
export async function sendVerificationEmail(
  to: string,
  fullName: string,
  otp: string,
  country: string,
): Promise<string> {
  return dispatch({
    to,
    kind: "verification",
    rendered: verificationTemplate({ fullName, otp, country }),
  });
}

/**
 * Send the password-reset email.
 *
 * @param to               Recipient email.
 * @param fullName         Recipient display name.
 * @param resetUrl         Fully-formed reset URL including the single-use token.
 * @param expiresInMinutes Token lifetime, shown to the user.
 * @returns The provider message id.
 * @throws {AppError} 400 invalid recipient / 502 on send failure.
 */
export async function sendPasswordResetEmail(
  to: string,
  fullName: string,
  resetUrl: string,
  expiresInMinutes: number,
): Promise<string> {
  return dispatch({
    to,
    kind: "password-reset",
    rendered: resetPasswordTemplate({ fullName, resetUrl, expiresInMinutes }),
  });
}

/**
 * Send the post-verification welcome email.
 *
 * @param to       Recipient email.
 * @param fullName Recipient display name.
 * @returns The provider message id.
 * @throws {AppError} 400 invalid recipient / 502 on send failure.
 */
export async function sendWelcomeEmail(
  to: string,
  fullName: string,
): Promise<string> {
  return dispatch({
    to,
    kind: "welcome",
    rendered: welcomeTemplate({ fullName }),
  });
}

/** Arguments for {@link sendComplaintReceivedEmail}. */
export interface ComplaintReceivedArgs {
  to: string;
  fullName: string;
  ticketNumber: string;
  category: string;
  status: string;
  address?: string | null;
}

/**
 * Send the citizen's complaint-received receipt email.
 *
 * @param args Recipient + complaint summary.
 * @returns The provider message id.
 * @throws {AppError} 400 invalid recipient / 502 on send failure.
 */
export async function sendComplaintReceivedEmail(
  args: ComplaintReceivedArgs,
): Promise<string> {
  const { to, fullName, ticketNumber, category, status, address } = args;
  return dispatch({
    to,
    kind: "complaint-received",
    rendered: complaintReceivedTemplate({
      fullName,
      ticketNumber,
      category,
      status,
      address: address ?? null,
    }),
  });
}

/** Arguments for {@link sendAdminNotificationEmail}. */
export interface AdminNotificationArgs {
  ticketNumber: string;
  category: string;
  severity: string;
  reportedBy: string;
  address?: string | null;
  /** Override recipient (e.g. the assigned authority). Defaults to ADMIN_EMAIL. */
  to?: string;
  /** Optional recipient display name for the greeting. */
  recipientName?: string;
}

/**
 * Send the admin/authority new-complaint notification.
 *
 * Defaults the recipient to the configured `ADMIN_EMAIL`, but accepts an
 * explicit `to` (used to notify a specific assigned authority).
 *
 * @param args Complaint summary + optional recipient override.
 * @returns The provider message id.
 * @throws {AppError} 400 invalid recipient / 502 on send failure.
 */
export async function sendAdminNotificationEmail(
  args: AdminNotificationArgs,
): Promise<string> {
  const to = args.to ?? adminEmail;
  return dispatch({
    to,
    kind: "admin-notification",
    rendered: adminNotificationTemplate({
      ticketNumber: args.ticketNumber,
      category: args.category,
      severity: args.severity,
      reportedBy: args.reportedBy,
      address: args.address ?? null,
      ...(args.recipientName ? { recipientName: args.recipientName } : {}),
    }),
  });
}

/** Arguments for {@link sendDistrictInviteEmail}. */
export interface DistrictInviteArgs {
  to: string;
  fullName: string;
  districtName: string;
  country: string;
  designation: string;
  activationUrl: string;
  expiryHours: number;
}

/**
 * Send the District Administrator appointment/invite email.
 *
 * @param args Recipient + appointment details + activation link.
 * @returns The provider message id.
 * @throws {AppError} 400 invalid recipient / 502 on send failure.
 */
export async function sendDistrictInviteEmail(
  args: DistrictInviteArgs,
): Promise<string> {
  return dispatch({
    to: args.to,
    kind: "district-invite",
    rendered: districtInviteEmailTemplate(
      args.fullName,
      args.districtName,
      args.country,
      args.designation,
      args.activationUrl,
      args.expiryHours,
    ),
  });
}

/** Arguments for {@link sendSubDistrictInviteEmail}. */
export interface SubDistrictInviteArgs {
  to: string;
  fullName: string;
  subDistrictName: string;
  districtName: string;
  country: string;
  designation: string;
  activationUrl: string;
  expiryHours: number;
}

/**
 * Send the Sub-District Administrator appointment/invite email.
 *
 * @param args Recipient + appointment details + activation link.
 * @returns The provider message id.
 * @throws {AppError} 400 invalid recipient / 502 on send failure.
 */
export async function sendSubDistrictInviteEmail(
  args: SubDistrictInviteArgs,
): Promise<string> {
  return dispatch({
    to: args.to,
    kind: "sub-district-invite",
    rendered: subDistrictInviteEmailTemplate(
      args.fullName,
      args.subDistrictName,
      args.districtName,
      args.country,
      args.designation,
      args.activationUrl,
      args.expiryHours,
    ),
  });
}
