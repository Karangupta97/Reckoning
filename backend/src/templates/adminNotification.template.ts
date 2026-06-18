/**
 * Admin / authority notification email template.
 *
 * Sent to an operator (or assigned authority) when a new complaint is filed.
 * Surfaces the ticket, severity, category, reporter, and location so triage can
 * start immediately. Rendered through the shared responsive, dark-mode-aware
 * {@link baseLayout}; every dynamic value is HTML-escaped.
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

/** Data required to render the admin/authority notification email. */
export interface AdminNotificationTemplateData {
  /** Unique human-readable ticket, e.g. `RW-IN-2026-000042`. */
  ticketNumber: string;
  /** Issue category (enum value or label). */
  category: string;
  /** Severity level (LOW | MEDIUM | HIGH | CRITICAL). */
  severity: string;
  /** Reporter label ("Anonymous Citizen" when anonymous). */
  reportedBy: string;
  /** Best-effort human-readable address; `null` when unavailable. */
  address?: string | null;
  /** Optional recipient name (e.g. the authority's display name). */
  recipientName?: string;
}

/** Background colour per severity, for the severity pill. */
const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#1A7F37",
  MEDIUM: "#9A6700",
  HIGH: "#BC4C00",
  CRITICAL: "#CF222E",
};

/** Convert an ENUM_LIKE_VALUE into a "Title Case" label. */
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Build a single label/value detail row.
 *
 * @param label Row label.
 * @param value Pre-escaped value HTML.
 * @returns HTML for the row.
 */
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td class="rw-muted" style="padding:8px 0;font-family:${FONT_STACK};font-size:14px;color:${palette.muted};width:120px;vertical-align:top;">${label}</td>
      <td class="rw-text" style="padding:8px 0;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${palette.text};">${value}</td>
    </tr>`;
}

/**
 * Render the admin/authority notification email.
 *
 * @param data Complaint summary + optional recipient name.
 * @returns Subject, HTML body, and plaintext alternative.
 */
export function adminNotificationTemplate(
  data: AdminNotificationTemplateData,
): RenderedEmail {
  const ticket = escapeHtml(data.ticketNumber);
  const category = escapeHtml(humanize(data.category));
  const severityKey = data.severity.toUpperCase();
  const severityColor = SEVERITY_COLORS[severityKey] ?? palette.muted;
  const severity = escapeHtml(humanize(data.severity));
  const reportedBy = escapeHtml(data.reportedBy);
  const address = data.address ? escapeHtml(data.address) : "Location recorded (see dashboard)";
  const greeting = data.recipientName ? `Hi ${escapeHtml(data.recipientName)},` : "New report filed";
  const reviewUrl = `${brand.appBaseUrl}/admin/complaints/${encodeURIComponent(data.ticketNumber)}`;

  const severityPill = `
    <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${severityColor};color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.3px;">
      ${severity.toUpperCase()}
    </span>`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;font-size:20px;font-weight:600;" class="rw-text">
      ${greeting}
    </p>
    <p class="rw-muted" style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${palette.muted};">
      A new road-issue complaint requires attention. Summary below.
    </p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
      ${detailRow("Ticket", `<span style="font-family:'SF Mono', Menlo, Consolas, monospace;">${ticket}</span>`)}
      ${detailRow("Severity", severityPill)}
      ${detailRow("Category", category)}
      ${detailRow("Reported by", reportedBy)}
      ${detailRow("Location", address)}
    </table>

    ${ctaButton("Review in Dashboard", reviewUrl)}`;

  const html = baseLayout({
    preheader: `[${severity}] New complaint ${data.ticketNumber} — ${category}`,
    bodyHtml,
  });

  const text =
    `New RoadWatch AI complaint requires attention.\n\n` +
    `Ticket: ${data.ticketNumber}\n` +
    `Severity: ${humanize(data.severity)}\n` +
    `Category: ${humanize(data.category)}\n` +
    `Reported by: ${data.reportedBy}\n` +
    `Location: ${data.address ?? "Location recorded (see dashboard)"}\n\n` +
    `Review: ${reviewUrl}\n\n` +
    `RoadWatch AI — Road Safety Hackathon 2026 (BIMSTEC)`;

  return {
    subject: `[${severityKey}] New complaint ${data.ticketNumber} — ${category}`,
    html,
    text,
  };
}
