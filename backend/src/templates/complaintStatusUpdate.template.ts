/**
 * Complaint status-update email template (citizen notification).
 *
 * Sent to the reporting citizen whenever their complaint/ticket transitions to
 * a new status — especially RESOLVED or REJECTED. Uses the shared responsive,
 * dark-mode-aware {@link baseLayout}. Every dynamic value is HTML-escaped
 * before interpolation.
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

/** Data required to render the status-update email. */
export interface StatusUpdateTemplateData {
  /** Citizen display name. */
  fullName: string;
  /** Unique ticket number (e.g. `RW-IN-2026-000042`). */
  ticketNumber: string;
  /** The new status the complaint transitioned to. */
  newStatus: string;
  /** Issue category label. */
  category: string;
  /** Best-effort address; `null` when unavailable. */
  address?: string | null;
}

/** Convert an ENUM_LIKE_VALUE into "Title Case". */
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Build a single label/value detail row.
 */
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td class="rw-muted" style="padding:8px 0;font-family:${FONT_STACK};font-size:14px;color:${palette.muted};width:120px;vertical-align:top;">${label}</td>
      <td class="rw-text" style="padding:8px 0;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${palette.text};">${value}</td>
    </tr>`;
}

/** Status-specific emoji + message for the citizen. */
function statusMessage(status: string): { emoji: string; message: string } {
  switch (status.toUpperCase()) {
    case "RESOLVED":
      return {
        emoji: "✅",
        message:
          "Great news! Your reported road issue has been resolved. Thank you for helping make our roads safer.",
      };
    case "REJECTED":
      return {
        emoji: "❌",
        message:
          "After review, your report could not be actioned at this time. If you believe this is incorrect, please submit a new report with additional details.",
      };
    case "IN_PROGRESS":
      return {
        emoji: "🔧",
        message:
          "Your reported issue is now being actively worked on. We'll notify you once it's resolved.",
      };
    case "ACKNOWLEDGED":
      return {
        emoji: "👀",
        message:
          "Your report has been acknowledged by the assigned authority and is under review.",
      };
    default:
      return {
        emoji: "📋",
        message: `Your complaint status has been updated to: ${humanize(status)}.`,
      };
  }
}

/**
 * Render the status-update notification email.
 *
 * @param data Citizen info + complaint/status details.
 * @returns Subject, HTML body, and plaintext alternative.
 */
export function complaintStatusUpdateTemplate(
  data: StatusUpdateTemplateData,
): RenderedEmail {
  const safeName = escapeHtml(data.fullName);
  const ticket = escapeHtml(data.ticketNumber);
  const newStatus = escapeHtml(humanize(data.newStatus));
  const category = escapeHtml(humanize(data.category));
  const address = data.address ? escapeHtml(data.address) : "Location recorded";
  const trackUrl = `${brand.appBaseUrl}/complaints/${encodeURIComponent(data.ticketNumber)}`;

  const { emoji, message } = statusMessage(data.newStatus);

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:20px;font-weight:600;" class="rw-text">
      ${emoji} Status Update, ${safeName}
    </p>
    <p class="rw-muted" style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${palette.muted};">
      ${escapeHtml(message)}
    </p>

    <div class="rw-code" style="background:${palette.codeBg};border:1px solid ${palette.border};border-radius:10px;padding:18px 22px;text-align:center;margin:0 0 24px 0;">
      <p class="rw-muted" style="margin:0 0 6px 0;font-size:13px;color:${palette.muted};letter-spacing:0.3px;">TICKET NUMBER</p>
      <div style="font-family:'SF Mono', Menlo, Consolas, monospace;font-size:24px;font-weight:700;letter-spacing:2px;color:${palette.navy};">${ticket}</div>
    </div>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
      ${detailRow("New Status", newStatus)}
      ${detailRow("Category", category)}
      ${detailRow("Location", address)}
    </table>

    ${ctaButton("View Your Report", trackUrl)}`;

  const html = baseLayout({
    preheader: `Your report ${data.ticketNumber} is now ${humanize(data.newStatus)}.`,
    bodyHtml,
  });

  const text =
    `Hi ${data.fullName},\n\n` +
    `${message}\n\n` +
    `Ticket: ${data.ticketNumber}\n` +
    `New Status: ${humanize(data.newStatus)}\n` +
    `Category: ${humanize(data.category)}\n` +
    `Location: ${data.address ?? "Location recorded"}\n\n` +
    `View your report: ${trackUrl}\n\n` +
    `RoadWatch AI — Road Safety Hackathon 2026 (BIMSTEC)`;

  return {
    subject: `${emoji} Your report ${data.ticketNumber} — ${humanize(data.newStatus)}`,
    html,
    text,
  };
}
