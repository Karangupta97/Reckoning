/**
 * RoadWatch AI OTP email template.
 *
 * Produces a self-contained, mobile-responsive HTML email using inline styles
 * (the only reliable way to style across email clients). No external CSS, no
 * web fonts, table-based layout for maximum client compatibility (Gmail,
 * Outlook, Apple Mail, etc.).
 */
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
};
/** Flag emoji per BIMSTEC country, with a neutral fallback. */
const COUNTRY_FLAGS = {
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
function flagFor(country) {
    const key = country.toUpperCase();
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
function escapeHtml(value) {
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
function renderDigitCells(otp) {
    const cells = otp
        .split("")
        .map((digit) => `
              <td align="center" style="padding:0 5px;">
                <div style="width:46px;height:58px;line-height:58px;background:${COLORS.cellBg};border:1px solid ${COLORS.border};border-radius:10px;font-size:30px;font-weight:700;color:${COLORS.navy};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(digit)}</div>
              </td>`)
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
export function otpEmailTemplate(otp, fullName, country) {
    const safeName = escapeHtml(fullName);
    const flag = flagFor(country);
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>RoadWatch AI Verification Code</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLORS.bg};">
    Your RoadWatch AI verification code is ${otp}. It expires in 10 minutes.
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${COLORS.white};border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(20,47,73,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${COLORS.navy};padding:28px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:${COLORS.white};letter-spacing:0.4px;">
                    \u{1F6E3}\uFE0F RoadWatch&nbsp;AI
                  </td>
                  <td align="right" style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#A9C0D6;">
                    Account Verification
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 8px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.text};">
              <p style="margin:0 0 14px 0;font-size:18px;font-weight:600;">
                Hi ${safeName}, ${flag}
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.muted};">
                Your RoadWatch AI verification code is:
              </p>
            </td>
          </tr>

          <!-- OTP cells -->
          <tr>
            <td style="padding:0 32px 8px 32px;">
              ${renderDigitCells(otp)}
            </td>
          </tr>

          <!-- Expiry warning -->
          <tr>
            <td align="center" style="padding:20px 32px 4px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:14px;font-weight:600;color:${COLORS.warn};">
                \u23F1\uFE0F This code expires in 10 minutes
              </p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:18px 32px 30px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <div style="border-top:1px solid ${COLORS.border};margin-bottom:18px;"></div>
              <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">
                \u{1F512} If you didn't request this, you can safely ignore this email.
                Someone may have typed your address by mistake \u2014 no account will be created.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${COLORS.navyDark};padding:20px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:12px;color:#9FB6CC;text-align:center;line-height:1.6;">
                <strong style="color:${COLORS.white};">RoadWatch AI</strong>
                &nbsp;|&nbsp; Road Safety Hackathon 2026 \u2013 BIMSTEC
              </p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#6E879E;text-align:center;">
                &copy; ${year} RoadWatch AI. This is an automated message, please do not reply.
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
//# sourceMappingURL=otpEmail.js.map