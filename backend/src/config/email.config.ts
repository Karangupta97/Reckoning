/**
 * Email configuration — single source of truth for the SES/SMTP mailer.
 *
 * Reads only from the validated {@link env} object (never `process.env`
 * directly) so every value here has already passed startup validation. This
 * module centralises:
 *
 *   - the Nodemailer SMTP transport options (host/port/auth/secure),
 *   - the canonical `From` header (name + address),
 *   - retry/timeout tuning, and
 *   - the brand metadata templates use for consistent look-and-feel.
 *
 * SMTP credentials are referenced by key only and are NEVER logged.
 */

import { env, isProduction } from "./env.js";

/**
 * Nodemailer SMTP transport options for Amazon SES.
 *
 * Port 465 implies implicit TLS (`secure: true`); any other port (typically
 * 587) uses STARTTLS (`secure: false` + `requireTLS`). SES requires TLS on
 * every port, so plaintext is never permitted.
 */
export interface SmtpTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  auth: { user: string; pass: string };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
  /** Cap concurrent SES connections so we stay within sane limits. */
  pool: true;
  maxConnections: number;
  maxMessages: number;
}

/** Connection/handshake/socket timeouts for the SMTP transport, in ms. */
const SMTP_TIMEOUTS = {
  connection: 10_000,
  greeting: 10_000,
  socket: 20_000,
} as const;

/**
 * Build the immutable SMTP transport configuration from validated env vars.
 *
 * @returns The transport options consumed by {@link nodemailer.createTransport}.
 */
export const smtpConfig: Readonly<SmtpTransportConfig> = Object.freeze({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  // 465 = implicit TLS; everything else (587) negotiates STARTTLS.
  secure: env.SMTP_PORT === 465,
  requireTLS: env.SMTP_PORT !== 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  connectionTimeout: SMTP_TIMEOUTS.connection,
  greetingTimeout: SMTP_TIMEOUTS.greeting,
  socketTimeout: SMTP_TIMEOUTS.socket,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

/**
 * Canonical `From` header, e.g. `"RoadWatch AI" <noreply@roadwatch.ai>`.
 *
 * Nodemailer encodes the display name safely, so no manual escaping is needed.
 */
export const emailFrom: string = `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`;

/** Bare sender address (without display name), for `Reply-To`/`Return-Path`. */
export const emailFromAddress: string = env.EMAIL_FROM;

/**
 * Recipient for operational/admin notifications. Falls back to the sender
 * address when `ADMIN_EMAIL` is not configured.
 */
export const adminEmail: string = env.ADMIN_EMAIL ?? env.EMAIL_FROM;

/** Retry policy for transient send failures (timeouts, 4xx SMTP, throttling). */
export const retryConfig = Object.freeze({
  /** Total send attempts (1 initial + N-1 retries). */
  maxAttempts: 3,
  /** Base delay between attempts, in ms (grows exponentially). */
  baseDelayMs: 500,
  /** Hard ceiling on any single backoff delay, in ms. */
  maxDelayMs: 5_000,
});

/**
 * Brand metadata injected into every email template so the look-and-feel and
 * support details stay consistent and are changeable in exactly one place.
 */
export const brand = Object.freeze({
  name: env.EMAIL_FROM_NAME,
  tagline: "Road Safety Hackathon 2026 • BIMSTEC",
  /** Primary brand colour (headers, buttons). */
  primaryColor: "#1A3C5E",
  /** Accent colour (links, highlights). */
  accentColor: "#2F80ED",
  /** Public app URL used to build in-email links. */
  appBaseUrl: env.APP_BASE_URL,
  /** Support mailbox surfaced in every footer. */
  supportEmail: emailFromAddress,
});

/** True when running in production (controls verbose SMTP debug logging). */
export const emailDebug: boolean = !isProduction;
