/**
 * Admin invite-token utilities.
 *
 * Invite tokens are high-entropy random UUIDs delivered to the invitee ONLY
 * via the activation email link. The database stores nothing but the SHA-256
 * digest of the token (`AdminUser.inviteTokenHash`), so a database leak can
 * never reveal a usable activation link. Lookups hash the incoming token and
 * match against the stored digest — fast, deterministic, and index-friendly.
 *
 * NEVER use these helpers for passwords — use bcrypt for those.
 */

import { randomUUID } from "node:crypto";
import { sha256 } from "./hash.js";

/** Invite-link lifetime, in hours, from the moment it is issued. */
export const INVITE_TTL_HOURS = 48;

/** Maximum number of times a single invite may be re-sent. */
export const MAX_INVITE_RESENDS = 3;

/** A freshly-minted invite: the raw token (emailed) and its at-rest hash. */
export interface GeneratedInvite {
  /** Raw UUID — embedded in the activation link, never persisted. */
  token: string;
  /** SHA-256 digest of {@link token} — the only value stored in the DB. */
  tokenHash: string;
  /** Absolute expiry timestamp ({@link INVITE_TTL_HOURS} from now). */
  expiresAt: Date;
}

/**
 * Generate a new invite token, its at-rest hash, and its expiry timestamp.
 *
 * @param from Reference time (defaults to now); the expiry is computed from it.
 * @returns The raw token, its SHA-256 hash, and the absolute expiry.
 */
export function generateInvite(from: Date = new Date()): GeneratedInvite {
  const token = randomUUID();
  return {
    token,
    tokenHash: sha256(token),
    expiresAt: new Date(from.getTime() + INVITE_TTL_HOURS * 60 * 60 * 1000),
  };
}

/**
 * Hash an incoming raw invite token for a constant-shape DB lookup.
 *
 * @param token Raw token supplied by the activation request.
 * @returns The SHA-256 digest to match against `inviteTokenHash`.
 */
export function hashInviteToken(token: string): string {
  return sha256(token);
}

/**
 * Build the full activation URL the invitee clicks from their email.
 *
 * @param baseUrl Configured activation base URL (no trailing slash expected).
 * @param token   Raw invite token to embed as the `token` query parameter.
 * @returns A fully-formed activation URL.
 */
export function buildActivationUrl(baseUrl: string, token: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}
