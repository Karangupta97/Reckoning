/**
 * Welcome email template.
 *
 * Sent once, immediately after a user successfully verifies their account.
 * Renders a friendly onboarding message + a CTA into the app inside the shared
 * responsive, dark-mode-aware {@link baseLayout}.
 */

import {
  baseLayout,
  ctaButton,
  escapeHtml,
  palette,
  FONT_STACK,
} from "./_layout.js";
import { brand } from "../config/email.config.js";
import type { RenderedEmail } from "./verification.template.js";

/** Data required to render the welcome email. */
export interface WelcomeTemplateData {
  /** Recipient display name (escaped internally). */
  fullName: string;
}

/** A single onboarding highlight row. */
const FEATURES: ReadonlyArray<{ icon: string; title: string; body: string }> = [
  {
    icon: "📍",
    title: "Report road issues",
    body: "Snap a photo, drop a pin, and submit potholes, faded markings, broken signs and more.",
  },
  {
    icon: "🛰️",
    title: "Smart routing",
    body: "Your report is automatically routed to the responsible authority for your area.",
  },
  {
    icon: "🔔",
    title: "Track progress",
    body: "Follow your complaint from submission through to resolution with a unique ticket number.",
  },
];

/**
 * Build the feature-list HTML block.
 *
 * @returns HTML for the onboarding highlights.
 */
function renderFeatures(): string {
  return FEATURES.map(
    (f) => `
      <tr>
        <td style="padding:10px 0;font-family:${FONT_STACK};vertical-align:top;width:34px;font-size:20px;">${f.icon}</td>
        <td style="padding:10px 0;font-family:${FONT_STACK};">
          <div class="rw-text" style="font-size:15px;font-weight:600;color:${palette.text};">${f.title}</div>
          <div class="rw-muted" style="font-size:14px;line-height:1.5;color:${palette.muted};">${f.body}</div>
        </td>
      </tr>`,
  ).join("");
}

/**
 * Render the welcome email.
 *
 * @param data Recipient name.
 * @returns Subject, HTML body, and plaintext alternative.
 */
export function welcomeTemplate(data: WelcomeTemplateData): RenderedEmail {
  const safeName = escapeHtml(data.fullName);

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:20px;font-weight:600;" class="rw-text">
      Welcome aboard, ${safeName}! 🎉
    </p>
    <p class="rw-muted" style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${palette.muted};">
      Your RoadWatch AI account is verified and ready. You're now part of a community
      working to make roads across BIMSTEC safer — one report at a time.
    </p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
      ${renderFeatures()}
    </table>

    ${ctaButton("Open RoadWatch AI", brand.appBaseUrl)}`;

  const html = baseLayout({
    preheader: "Your RoadWatch AI account is verified and ready to go.",
    bodyHtml,
  });

  const text =
    `Welcome aboard, ${data.fullName}!\n\n` +
    `Your RoadWatch AI account is verified and ready.\n\n` +
    `What you can do:\n` +
    FEATURES.map((f) => `- ${f.title}: ${f.body}`).join("\n") +
    `\n\nOpen RoadWatch AI: ${brand.appBaseUrl}\n\n` +
    `RoadWatch AI — Road Safety Hackathon 2026 (BIMSTEC)`;

  return {
    subject: "Welcome to RoadWatch AI 🛣️",
    html,
    text,
  };
}
