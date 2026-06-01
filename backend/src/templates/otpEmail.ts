/**
 * RoadWatch AI OTP email template.
 *
 * Produces a self-contained, mobile-responsive HTML email using inline styles
 * (the only reliable way to style across email clients). No external CSS, no
 * web fonts, table-based layout for maximum client compatibility (Gmail,
 * Outlook, Apple Mail, etc.).
 */

/** BIMSTEC country codes accepted by the template. */
export type CountryCode =
  | "INDIA"
  | "BANGLADESH"
  | "NEPAL"
  | "SRI_LANKA"
  | "MYANMAR"
  | "THAILAND"
  | "BHUTAN";

/** Brand palette, centralised so the look stays consistent. */
const COLORS = {
  navy: "#1A3C5E",
  navyDark: "#142F49",
  accent: "#2F80ED",
  text: "#1F2933",
  muted: "#647382",
  border: "#E3E8EF",
  bg: "#F4F6F9",
  cellBg: "#EEF3F9",
  white: "#FFFFFF",
  warn: "#B54708",
} as const;

/** Flag emoji per BIMSTEC country, with a neutral fallback. */
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
 * Resolve a country's flag emoji, tolerating unknown/lower-case input.
 *
 * @param country Raw country value.
 * @returns The flag emoji, or a globe emoji when unrecognised.
 */
function flagFor(country: string): string {
  const key = country.toUpperCase() as CountryCode;
  return COUNTRY_FLAGS[key] ?? "\u{1F30F}";
}

/**
 * Minimal HTML escaping for values interpolated into the template.
 *
 * Prevents a user-supplied name from breaking the markup or injecting tags.
 *
 * @param value Raw string to escape.
 * @returns HTML-safe string.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Render the OTP code as a row of individual digit cells.
 *
 * Each digit gets its own bordered cell, e.g. `[ 4 ][ 8 ][ 2 ]...`, which
 * reads clearly on every device.
 *
 * @param otp The numeric OTP string.
 * @returns HTML for the digit-cell row.
 */
function renderDigitCells(otp: string): string {
  const cells = otp
    .split("")
    .map(
      (digit) => `
              <td align="center" style="padding:0 5px;">
                <div style="width:46px;height:58px;line-height:58px;background:${COLORS.cellBg};border:1px solid ${COLORS.border};border-radius:10px;font-size:30px;font-weight:700;color:${COLORS.navy};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(
                digit,
              )}</div>
              </td>`,
    )
    .join("");

  return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
          <tr>${cells}
          </tr>
        </table>`;
}

/**
 * Build the full HTML body for the OTP verification email.
 *
 * @param otp      6-digit verification code (rendered, never logged here).
 * @param fullName Recipient's display name (HTML-escaped before use).
 * @param country  BIMSTEC country code used to pick the greeting flag.
 * @returns A complete HTML document string ready to send via ElasticEmail.
 */
export function otpEmailTemplate(
  otp: string,
  fullName: string,
  country: string,
): string {
  const safeName = escapeHtml(fullName);
  const flag = flagFor(country);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Reckoning AI Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fa;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f6f8fa;">
    Your Reckoning AI verification code is ${otp}. It expires in 10 minutes.
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f6f8fa;">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #d0d7de;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background:#24292f;padding:28px 32px;text-align:center;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                    Reckoning
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#8b949e;padding-top:4px;">
                    Road Safety Hackathon 2026 • BIMSTEC
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 32px 20px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#24292f;">
              <p style="margin:0 0 16px 0;font-size:20px;font-weight:600;">
                Hi ${safeName},
              </p>
              
              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#57606a;">
                Here's your verification code to sign in to your Reckoning AI account:
              </p>

              <!-- OTP Box - GitHub Style -->
              <div style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
                <p style="margin:0 0 12px 0;font-size:15px;color:#57606a;font-weight:500;">Verification Code</p>
                <div style="font-family:'SF Mono', Monaco, Consolas, monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#24292f;background:#ffffff;border:2px solid #d0d7de;border-radius:8px;padding:16px 24px;display:inline-block;">
                  ${otp}
                </div>
              </div>

              <p style="margin:0 0 24px 0;font-size:14px;color:#57606a;">
                This code will expire in <strong>10 minutes</strong>.
              </p>

              <!-- Security Note -->
              <div style="background:#fff8c5;border-left:4px solid #d4a017;padding:16px 20px;border-radius:6px;margin:24px 0;">
                <p style="margin:0;font-size:14px;color:#664e00;">
                  🔒 If you didn't request this code, you can safely ignore this email. 
                  No account will be created.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f6f8fa;border-top:1px solid #d0d7de;padding:24px 32px;">
              <p style="margin:0;font-size:13px;color:#57606a;text-align:center;line-height:1.5;">
                <strong>Reckoning AI</strong> • Road Safety Hackathon 2026 – BIMSTEC
              </p>
              <p style="margin:8px 0 0 0;font-size:12px;color:#8b949e;text-align:center;">
                © ${year} Reckoning AI. This is an automated message.
              </p>
              <p style="margin:12px 0 0 0;font-size:12px;color:#8b949e;text-align:center;">
                <a href="${unsubscribeLink}" style="color:#8b949e;text-decoration:underline;">Unsubscribe</a>
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
