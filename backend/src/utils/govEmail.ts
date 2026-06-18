/**
 * Government email-domain validation.
 *
 * Admin invites must go to official government mailboxes, never to personal
 * webmail providers. This module is the single source of truth for that rule
 * and is consumed by the district + sub-district invite validation schemas.
 *
 * The policy is two-pronged:
 *   1. An explicit DENY list of consumer webmail providers (gmail, yahoo, …).
 *   2. An ALLOW heuristic for recognised BIMSTEC government TLD patterns
 *      (gov.in, nic.in, .gov.bd, .gov.np, .gov.lk, .gov.mm, .go.th, .gov.bt).
 *
 * Any domain that is not on the deny list AND not obviously personal is
 * accepted (custom government domains are permitted per the spec), but the
 * deny list always wins.
 */

/** Consumer webmail domains that are NEVER acceptable for an admin invite. */
const PERSONAL_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "zoho.com",
  "mail.com",
  "yandex.com",
]);

/**
 * Recognised BIMSTEC government domain suffixes. A match here is a strong
 * positive signal; these are documented for clarity and future tightening.
 */
export const GOV_DOMAIN_SUFFIXES: readonly string[] = [
  "gov.in",
  "nic.in",
  "gov.bd",
  "gov.np",
  "gov.lk",
  "gov.mm",
  "go.th",
  "gov.bt",
  "gov", // generic .gov
];

/** Outcome of a government-email check. */
export interface GovEmailCheck {
  /** `true` when the address is acceptable for an admin invite. */
  ok: boolean;
  /** Machine-readable reason when `ok` is false. */
  reason?: string;
}

/**
 * Extract the lower-cased domain portion of an email address.
 *
 * @param email Candidate email (any casing).
 * @returns The domain (after `@`), lower-cased, or `null` when malformed.
 */
function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

/**
 * Determine whether an email belongs to a recognised government domain pattern.
 *
 * @param domain Lower-cased email domain.
 * @returns `true` when the domain matches a known government suffix.
 */
export function isGovDomain(domain: string): boolean {
  return GOV_DOMAIN_SUFFIXES.some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`),
  );
}

/**
 * Validate that an email address is an official government mailbox suitable
 * for an admin invite.
 *
 * Rules (in order):
 *   1. Malformed / domain-less → reject.
 *   2. Known personal webmail provider → reject.
 *   3. Recognised government suffix → accept.
 *   4. Otherwise → accept (custom government domains are allowed).
 *
 * @param email Candidate email address.
 * @returns `{ ok: true }` when acceptable, else `{ ok: false, reason }`.
 */
export function validateGovEmail(email: string): GovEmailCheck {
  const domain = domainOf(email);
  if (!domain) {
    return { ok: false, reason: "Enter a valid email address." };
  }
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason:
        "Personal email providers are not allowed. Use an official government email address.",
    };
  }
  // Custom government domains are permitted; the deny list above is the gate.
  return { ok: true };
}

/**
 * Boolean convenience wrapper around {@link validateGovEmail} for use inside
 * Zod `.refine` predicates.
 *
 * @param email Candidate email address.
 * @returns `true` when the address passes the government-email policy.
 */
export function isGovEmail(email: string): boolean {
  return validateGovEmail(email).ok;
}
