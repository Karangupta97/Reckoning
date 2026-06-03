/**
 * Password-reset email template.
 *
 * Renders a time-limited reset link (CTA button + copyable fallback URL) inside
 * the shared responsive, dark-mode-aware {@link baseLayout}. The reset URL is
 * assumed to already carry an opaque, single-use token as a query parameter;
 * the recipient name is HTML-escaped before interpolation.
 */

import {
  baseLayout,
  ctaButton,
  escapeHtml,
  palette,
  FONT_STACK,
} from "./_layout.js";
import type { RenderedEmail } from "./verification.template.js";

/** Data required to render the password-reset email. */
export interface ResetPasswordTemplateData {
  /** Recipient display name (escaped internally). */
  fullName: string;
  /** Fully-formed reset URL including the single-use token. */
  resetUrl: string;
  /** Token lifetime in minutes (shown to the user). */
  expiresInMinutes: number;
}

/**
 * Render the password-reset email.
 *
 * @param data Recipient name, reset URL, and expiry window.
 * @returns Subject, HTML body, and plaintext alternative.
 */
export function resetPasswordTemplate(
  data: ResetPasswordTemplateData,
): RenderedEmail {
  const safeName = escapeHtml(data.fullName);
  const safeUrl = encodeURI(data.resetUrl);
  const { expiresInMinutes } = data;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:20px;font-weight:600;" class="rw-text">
      Hi ${safeName},
    </p>
    <p class="rw-muted" style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${palette.muted};">
      We received a request to reset the password for your RoadWatch AI account.
      Click the button below to choose a new password.
    </p>

    ${ctaButton("Reset Password", safeUrl)}

    <p class="rw-muted" style="margin:24px 0 8px 0;font-size:14px;color:${palette.muted};">
      This link expires in <strong style="color:${palette.text};">${expiresInMinutes} minutes</strong>
      and can only be used once.
    </p>

    <p class="rw-muted" style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:${palette.muted};">
      If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="margin:6px 0 0 0;font-size:13px;line-height:1.5;word-break:break-all;">
      <a href="${safeUrl}" style="color:${palette.accent};text-decoration:underline;">${escapeHtml(data.resetUrl)}</a>
    </p>`;

  const html = baseLayout({
    preheader: `Reset your RoadWatch AI password. This link expires in ${expiresInMinutes} minutes.`,
    bodyHtml,
    securityNote:
      "If you didn't request a password reset, you can safely ignore this email — your password will stay the same.",
  });

  const text =
    `Hi ${data.fullName},\n\n` +
    `We received a request to reset your RoadWatch AI password.\n` +
    `Use this link to choose a new password (expires in ${expiresInMinutes} minutes, single use):\n\n` +
    `${data.resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email.\n\n` +
    `RoadWatch AI — Road Safety Hackathon 2026 (BIMSTEC)`;

  return {
    subject: "Reset your RoadWatch AI password",
    html,
    text,
  };
}
