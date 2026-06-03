/**
 * OTP verification email template.
 *
 * Renders the 6-digit sign-up verification code inside the shared, responsive,
 * dark-mode-aware {@link baseLayout}. The code is shown both as a single
 * letter-spaced block and (implicitly) in the preheader so it previews in the
 * inbox. The recipient name is HTML-escaped before interpolation.
 */

import { OTP_TTL_MINUTES } from "../utils/otp.js";
import {
  baseLayout,
  escapeHtml,
  palette,
} from "./_layout.js";

/** BIMSTEC country codes recognised for the greeting flag. */
export type CountryCode =
  | "INDIA"
  | "BANGLADESH"
  | "NEPAL"
  | "SRI_LANKA"
  | "MYANMAR"
  | "THAILAND"
  | "BHUTAN";

/** Flag emoji per BIMSTEC country, with a neutral globe fallback. */
const COUNTRY_FLAGS: Record<CountryCode, string> = {
  INDIA: "\u{1F1EE}\u{1F1F3}",
  BANGLADESH: "\u{1F1E7}\u{1F1E9}",
  NEPAL: "\u{1F1F3}\u{1F1F5}",
  SRI_LANKA: "\u{1F1F1}\u{1F1F0}",
  MYANMAR: "\u{1F1F2}\u{1F1F2}",
  THAILAND: "\u{1F1F9}\u{1F1ED}",
  BHUTAN: "\u{1F1E7}\u{1F1F9}",
};

/**
 * Resolve a country's flag emoji, tolerating unknown / lower-case input.
 *
 * @param country Raw country value.
 * @returns The flag emoji, or a globe emoji when unrecognised.
 */
function flagFor(country: string): string {
  const key = country.toUpperCase() as CountryCode;
  return COUNTRY_FLAGS[key] ?? "\u{1F30F}";
}

/** Data required to render the verification email. */
export interface VerificationTemplateData {
  /** Recipient display name (escaped internally). */
  fullName: string;
  /** 6-digit verification code. */
  otp: string;
  /** BIMSTEC country code (selects the greeting flag). */
  country: string;
}

/** Rendered email parts (subject + HTML + plaintext alternative). */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Render the OTP verification email.
 *
 * @param data Recipient name, OTP, and country.
 * @returns Subject, HTML body, and plaintext alternative.
 */
export function verificationTemplate(data: VerificationTemplateData): RenderedEmail {
  const safeName = escapeHtml(data.fullName);
  const flag = flagFor(data.country);
  const { otp } = data;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:20px;font-weight:600;" class="rw-text">
      Hi ${safeName} ${flag},
    </p>
    <p class="rw-muted" style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${palette.muted};">
      Use the verification code below to confirm your email and finish setting up your
      RoadWatch AI account.
    </p>

    <div class="rw-code" style="background:${palette.codeBg};border:1px solid ${palette.border};border-radius:10px;padding:22px;text-align:center;margin:24px 0;">
      <p class="rw-muted" style="margin:0 0 10px 0;font-size:14px;color:${palette.muted};font-weight:500;letter-spacing:0.3px;">VERIFICATION CODE</p>
      <div style="font-family:'SF Mono', Menlo, Consolas, monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${palette.navy};">
        ${escapeHtml(otp)}
      </div>
    </div>

    <p class="rw-muted" style="margin:0 0 8px 0;font-size:14px;color:${palette.muted};">
      This code expires in <strong style="color:${palette.text};">${OTP_TTL_MINUTES} minutes</strong>.
    </p>`;

  const html = baseLayout({
    preheader: `Your RoadWatch AI verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    bodyHtml,
    securityNote:
      "If you didn't request this code, you can safely ignore this email — no account will be created.",
  });

  const text =
    `Hi ${data.fullName},\n\n` +
    `Your RoadWatch AI verification code is: ${otp}\n` +
    `This code expires in ${OTP_TTL_MINUTES} minutes.\n\n` +
    `If you didn't request this, you can safely ignore this email.\n\n` +
    `RoadWatch AI — Road Safety Hackathon 2026 (BIMSTEC)`;

  return {
    subject: `Your RoadWatch AI verification code: ${otp}`,
    html,
    text,
  };
}
