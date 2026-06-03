/**
 * Shared email-template primitives.
 *
 * Every RoadWatch AI transactional email is rendered through {@link baseLayout}
 * so branding, mobile responsiveness, dark-mode support, the security notice,
 * and the support footer stay identical across templates. Styles are inline
 * (the only reliable approach for email clients) with a small `<style>` block
 * for `prefers-color-scheme` dark mode and width media queries.
 *
 * All caller-supplied dynamic content MUST be passed through {@link escapeHtml}
 * (or {@link sanitizeText}) before interpolation to prevent HTML injection.
 */

import { brand } from "../config/email.config.js";

/** Brand palette shared by the layout and template bodies. */
export const palette = {
  navy: "#1A3C5E",
  navyDark: "#142F49",
  accent: "#2F80ED",
  text: "#1F2933",
  muted: "#647382",
  border: "#E3E8EF",
  bg: "#F4F6F9",
  panel: "#FFFFFF",
  codeBg: "#EEF3F9",
  warnBg: "#FFF8C5",
  warnBorder: "#D4A017",
  warnText: "#664E00",
  // Dark-mode equivalents (applied via prefers-color-scheme).
  darkBg: "#0D1117",
  darkPanel: "#161B22",
  darkText: "#E6EDF3",
  darkMuted: "#8B949E",
  darkBorder: "#30363D",
} as const;

/** Font stack used across every template (no web fonts — client-safe). */
export const FONT_STACK =
  "'Segoe UI', Roboto, Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Escape a string for safe interpolation into HTML.
 *
 * Neutralises `& < > " '` so user-supplied values (names, addresses, ticket
 * text) can never break the markup or inject tags/attributes.
 *
 * @param value Raw string to escape.
 * @returns HTML-safe string.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Collapse whitespace and escape a free-text value for inline display.
 *
 * @param value Raw, possibly multi-line text.
 * @returns A trimmed, single-spaced, HTML-safe string.
 */
export function sanitizeText(value: string): string {
  return escapeHtml(value.replace(/\s+/g, " ").trim());
}

/** Options accepted by {@link baseLayout}. */
export interface LayoutOptions {
  /** `<title>` + hidden preheader text shown in inbox previews. */
  preheader: string;
  /** Pre-escaped HTML for the main content area (between header and footer). */
  bodyHtml: string;
  /** Optional security/footer note appended above the standard footer. */
  securityNote?: string;
}

/**
 * Render a primary call-to-action button (bulletproof, table-based).
 *
 * @param label Button text (escaped by the caller if dynamic).
 * @param href  Destination URL.
 * @returns HTML for a centred CTA button.
 */
export function ctaButton(label: string, href: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0 auto;">
      <tr>
        <td align="center" bgcolor="${brand.primaryColor}" style="border-radius:8px;">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * Render a highlighted security/advisory callout box.
 *
 * @param message Pre-escaped advisory text.
 * @returns HTML for the callout.
 */
export function securityCallout(message: string): string {
  return `
    <div style="background:${palette.warnBg};border-left:4px solid ${palette.warnBorder};padding:14px 18px;border-radius:6px;margin:24px 0;">
      <p style="margin:0;font-size:14px;line-height:1.5;color:${palette.warnText};">
        🔒 ${message}
      </p>
    </div>`;
}

/**
 * Wrap pre-rendered body HTML in the shared, responsive, dark-mode-aware shell.
 *
 * @param options Preheader, body HTML, and optional security note.
 * @returns A complete HTML document string ready to send.
 */
export function baseLayout({ preheader, bodyHtml, securityNote }: LayoutOptions): string {
  const year = new Date().getFullYear();
  const safePreheader = escapeHtml(preheader);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(brand.name)}</title>
  <style>
    /* Mobile responsiveness */
    @media only screen and (max-width: 620px) {
      .rw-container { width: 100% !important; }
      .rw-pad { padding-left: 22px !important; padding-right: 22px !important; }
    }
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body, .rw-body { background: ${palette.darkBg} !important; }
      .rw-card { background: ${palette.darkPanel} !important; border-color: ${palette.darkBorder} !important; }
      .rw-text { color: ${palette.darkText} !important; }
      .rw-muted { color: ${palette.darkMuted} !important; }
      .rw-footer { background: ${palette.darkPanel} !important; border-color: ${palette.darkBorder} !important; }
      .rw-code { background: ${palette.darkBg} !important; color: ${palette.darkText} !important; border-color: ${palette.darkBorder} !important; }
    }
  </style>
</head>
<body class="rw-body" style="margin:0;padding:0;background:${palette.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${palette.bg};">
    ${safePreheader}
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="rw-body" style="background:${palette.bg};">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" class="rw-container rw-card"
               style="max-width:600px;background:${palette.panel};border:1px solid ${palette.border};border-radius:14px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:${brand.primaryColor};padding:28px 32px;text-align:center;">
              <div style="font-family:${FONT_STACK};font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                🛣️ ${escapeHtml(brand.name)}
              </div>
              <div style="font-family:${FONT_STACK};font-size:13px;color:#B7C7D8;padding-top:4px;">
                ${escapeHtml(brand.tagline)}
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="rw-pad rw-text" style="padding:36px 32px 8px 32px;font-family:${FONT_STACK};color:${palette.text};">
              ${bodyHtml}
              ${securityNote ? securityCallout(securityNote) : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="rw-footer" style="background:${palette.bg};border-top:1px solid ${palette.border};padding:24px 32px;">
              <p class="rw-muted" style="margin:0;font-size:13px;color:${palette.muted};text-align:center;line-height:1.5;">
                <strong>${escapeHtml(brand.name)}</strong> • ${escapeHtml(brand.tagline)}
              </p>
              <p class="rw-muted" style="margin:8px 0 0 0;font-size:12px;color:${palette.muted};text-align:center;">
                Need help? Contact
                <a href="mailto:${brand.supportEmail}" style="color:${brand.accentColor};text-decoration:none;">${escapeHtml(brand.supportEmail)}</a>
              </p>
              <p class="rw-muted" style="margin:8px 0 0 0;font-size:12px;color:${palette.muted};text-align:center;">
                © ${year} ${escapeHtml(brand.name)}. This is an automated message — please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
