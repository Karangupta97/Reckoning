/**
 * Complaint-received (citizen receipt) email template.
 *
 * Sent to the reporting citizen right after a complaint is stored. Confirms the
 * submission and surfaces the unique ticket number, category, status, and
 * location summary inside the shared responsive, dark-mode-aware
 * {@link baseLayout}. Every dynamic value is HTML-escaped before interpolation.
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

/** Data required to render the complaint-received email. */
export interface ComplaintReceivedTemplateData {
  /** Recipient display name (escaped internally). */
  fullName: string;
  /** Unique human-readable ticket, e.g. `RW-IN-2026-000042`. */
  ticketNumber: string;
  /** Issue category (enum value or label). */
  category: string;
  /** Current complaint status. */
  status: string;
  /** Best-effort human-readable address; `null` when unavailable. */
  address?: string | null;
}

/**
 * Build a single label/value detail row.
 *
 * @param label Row label (escaped by the caller if dynamic).
 * @param value Pre-escaped row value HTML.
 * @returns HTML for the detail row.
 */
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td class="rw-muted" style="padding:8px 0;font-family:${FONT_STACK};font-size:14px;color:${palette.muted};width:120px;vertical-align:top;">${label}</td>
      <td class="rw-text" style="padding:8px 0;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${palette.text};">${value}</td>
    </tr>`;
}

/** Convert an ENUM_LIKE_VALUE into a "Title Case" label. */
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Render the complaint-received email.
 *
 * @param data Recipient + complaint summary.
 * @returns Subject, HTML body, and plaintext alternative.
 */
export function complaintReceivedTemplate(
  data: ComplaintReceivedTemplateData,
): RenderedEmail {
  const safeName = escapeHtml(data.fullName);
  const ticket = escapeHtml(data.ticketNumber);
  const category = escapeHtml(humanize(data.category));
  const status = escapeHtml(humanize(data.status));
  const address = data.address ? escapeHtml(data.address) : "Location recorded";
  const trackUrl = `${brand.appBaseUrl}/complaints/${encodeURIComponent(data.ticketNumber)}`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:20px;font-weight:600;" class="rw-text">
      Thanks, ${safeName} — we've got it. ✅
    </p>
    <p class="rw-muted" style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${palette.muted};">
      Your road-issue report has been received and routed for review. Keep the ticket
      number below to track its progress.
    </p>

    <div class="rw-code" style="background:${palette.codeBg};border:1px solid ${palette.border};border-radius:10px;padding:18px 22px;text-align:center;margin:0 0 24px 0;">
      <p class="rw-muted" style="margin:0 0 6px 0;font-size:13px;color:${palette.muted};letter-spacing:0.3px;">TICKET NUMBER</p>
      <div style="font-family:'SF Mono', Menlo, Consolas, monospace;font-size:24px;font-weight:700;letter-spacing:2px;color:${palette.navy};">${ticket}</div>
    </div>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
      ${detailRow("Category", category)}
      ${detailRow("Status", status)}
      ${detailRow("Location", address)}
    </table>

    ${ctaButton("Track Your Report", trackUrl)}`;

  const html = baseLayout({
    preheader: `Report received — ticket ${data.ticketNumber}. We'll keep you posted.`,
    bodyHtml,
  });

  const text =
    `Hi ${data.fullName},\n\n` +
    `Your RoadWatch AI report has been received.\n\n` +
    `Ticket number: ${data.ticketNumber}\n` +
    `Category: ${humanize(data.category)}\n` +
    `Status: ${humanize(data.status)}\n` +
    `Location: ${data.address ?? "Location recorded"}\n\n` +
    `Track your report: ${trackUrl}\n\n` +
    `RoadWatch AI — Road Safety Hackathon 2026 (BIMSTEC)`;

  return {
    subject: `Report received — Ticket ${data.ticketNumber}`,
    html,
    text,
  };
}
