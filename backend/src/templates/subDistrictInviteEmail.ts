/**
 * Sub-District Administrator invite email template.
 *
 * Sent by a District Admin's invite action. Mirrors the district invite design
 * but shows BOTH the sub-district and its parent district, and names the
 * appointing district administration. All dynamic values are HTML-escaped.
 */

import {
  baseLayout,
  ctaButton,
  escapeHtml,
  palette,
  FONT_STACK,
} from "./_layout.js";
import type { RenderedEmail } from "./verification.template.js";

/** BIMSTEC country codes recognised for the appointment flag. */
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

/** Human-readable country name per BIMSTEC code. */
const COUNTRY_NAMES: Record<CountryCode, string> = {
  INDIA: "India",
  BANGLADESH: "Bangladesh",
  NEPAL: "Nepal",
  SRI_LANKA: "Sri Lanka",
  MYANMAR: "Myanmar",
  THAILAND: "Thailand",
  BHUTAN: "Bhutan",
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

/**
 * Resolve a country's display name, tolerating unknown / lower-case input.
 *
 * @param country Raw country value.
 * @returns A human-readable country name, or the raw value when unrecognised.
 */
function nameFor(country: string): string {
  const key = country.toUpperCase() as CountryCode;
  return COUNTRY_NAMES[key] ?? country;
}

/** Render a labelled detail row used in the appointment summary card. */
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 0;font-family:${FONT_STACK};font-size:14px;color:${palette.muted};width:150px;vertical-align:top;">${label}</td>
      <td class="rw-text" style="padding:6px 0;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${palette.text};">${value}</td>
    </tr>`;
}

/**
 * Render the Sub-District Administrator invite email.
 *
 * @param name            Invitee display name.
 * @param subDistrictName Sub-district the invitee will administer.
 * @param districtName    Parent district name.
 * @param country         BIMSTEC country code (selects flag + name).
 * @param designation     Official designation, e.g. "Junior Engineer, PWD".
 * @param activationUrl   Fully-formed activation link (includes the raw token).
 * @param expiryHours     Invite lifetime in hours, shown in the warning.
 * @returns Subject, HTML body, and plaintext alternative.
 */
export function subDistrictInviteEmailTemplate(
  name: string,
  subDistrictName: string,
  districtName: string,
  country: string,
  designation: string,
  activationUrl: string,
  expiryHours: number,
): RenderedEmail {
  const safeName = escapeHtml(name);
  const safeSubDistrict = escapeHtml(subDistrictName);
  const safeDistrict = escapeHtml(districtName);
  const safeDesignation = escapeHtml(designation);
  const flag = flagFor(country);
  const countryName = escapeHtml(nameFor(country));

  const bodyHtml = `
    <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${palette.accent};">
      Official Appointment
    </p>
    <p style="margin:0 0 16px 0;font-size:22px;font-weight:700;" class="rw-text">
      You have been appointed as Sub-District Administrator
    </p>
    <p class="rw-muted" style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${palette.muted};">
      Hello ${safeName}, you have been invited to administer road-safety operations
      for the sub-district below on RoadWatch AI.
    </p>

    <div class="rw-code" style="background:${palette.codeBg};border:1px solid ${palette.border};border-radius:10px;padding:20px 22px;margin:8px 0 24px 0;">
      <div class="rw-text" style="font-family:${FONT_STACK};font-size:20px;font-weight:700;color:${palette.navy};margin-bottom:6px;">
        ${flag}&nbsp;&nbsp;${safeSubDistrict}
      </div>
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        ${detailRow("Sub-District", safeSubDistrict)}
        ${detailRow("District", safeDistrict)}
        ${detailRow("Country", `${flag} ${countryName}`)}
        ${detailRow("Designation", safeDesignation)}
        ${detailRow("Role", "Sub-District Administrator")}
      </table>
    </div>

    <p class="rw-muted" style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:${palette.muted};">
      Appointed by: <strong class="rw-text" style="color:${palette.text};">${safeDistrict} District Administration</strong>
    </p>

    <p class="rw-muted" style="margin:16px 0 20px 0;font-size:15px;line-height:1.6;color:${palette.muted};">
      To accept this appointment, activate your account and set a secure password:
    </p>

    ${ctaButton("Activate Your Account", activationUrl)}

    <p class="rw-muted" style="margin:24px 0 0 0;font-size:13px;line-height:1.5;color:${palette.muted};text-align:center;">
      Or paste this link into your browser:<br />
      <span style="word-break:break-all;color:${palette.accent};">${escapeHtml(activationUrl)}</span>
    </p>

    <div style="background:${palette.warnBg};border-left:4px solid ${palette.warnBorder};padding:14px 18px;border-radius:6px;margin:24px 0 0 0;">
      <p style="margin:0;font-size:14px;line-height:1.5;color:${palette.warnText};">
        ⏳ This activation link expires in <strong>${expiryHours} hours</strong>.
      </p>
    </div>`;

  const html = baseLayout({
    preheader: `You have been appointed as Sub-District Administrator for ${subDistrictName}, ${districtName}. Activate within ${expiryHours} hours.`,
    bodyHtml,
    securityNote:
      "If you did not expect this appointment, contact your district office immediately and do not click the link above.",
  });

  const text =
    `Official Appointment — RoadWatch AI\n\n` +
    `Hello ${name},\n\n` +
    `You have been appointed as Sub-District Administrator for ${subDistrictName}, ` +
    `${districtName} (${nameFor(country)}).\n` +
    `Designation: ${designation}\n` +
    `Appointed by: ${districtName} District Administration\n\n` +
    `Activate your account and set a password using the link below:\n` +
    `${activationUrl}\n\n` +
    `This activation link expires in ${expiryHours} hours.\n\n` +
    `If you did not expect this appointment, contact your district office immediately.\n\n` +
    `RoadWatch AI — Road Safety Hackathon 2026 (BIMSTEC)`;

  return {
    subject: `RoadWatch AI — You are appointed Sub-District Administrator for ${subDistrictName}`,
    html,
    text,
  };
}
