/**
 * Admin JSON Web Token helpers.
 *
 * The admin auth realm is fully isolated from the citizen realm: it signs with
 * its OWN secrets ({@link env.ADMIN_JWT_ACCESS_SECRET} /
 * {@link env.ADMIN_JWT_REFRESH_SECRET}) so a citizen token can never be
 * replayed against an admin endpoint and vice versa. All tokens use HS256.
 *
 *   - Access token  — short-lived (default 15m), sent on every admin request.
 *   - Refresh token — long-lived  (default 7d), exchanged for a new access
 *                      token. Only a HASH of the refresh token is stored in
 *                      the DB; the raw token lives client-side only.
 */

import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

/** Admin roles mirrored from the Prisma `AdminRole` enum (kept local to avoid a cycle). */
export type AdminRole = "SUPER_ADMIN" | "DISTRICT_ADMIN" | "SUB_DISTRICT_ADMIN";

/** Countries mirrored from the Prisma `Country` enum (kept local to avoid a cycle). */
export type AdminCountry =
  | "INDIA"
  | "BANGLADESH"
  | "NEPAL"
  | "SRI_LANKA"
  | "MYANMAR"
  | "THAILAND"
  | "BHUTAN";

/** Custom claims embedded in every admin token. */
export interface AdminTokenClaims {
  /** Admin id (also set as the JWT `sub`). */
  sub: string;
  /** Admin email. */
  email: string;
  /** Admin role (drives RBAC). */
  role: AdminRole;
  /** Jurisdiction district id, null for SUPER_ADMIN. */
  districtId: string | null;
  /** Jurisdiction sub-district id, null for SUPER_ADMIN/DISTRICT_ADMIN. */
  subDistrictId: string | null;
  /** Jurisdiction country, null for SUPER_ADMIN. */
  country: AdminCountry | null;
  /** Token flavour, used to reject cross-use of access/refresh tokens. */
  type: "access" | "refresh";
}

/** Fully-decoded admin token: our claims plus the standard registered claims. */
export type DecodedAdminToken = AdminTokenClaims & JwtPayload;

/** Algorithm used for all admin tokens. */
const ALGORITHM = "HS256" as const;

/** Shape of the data needed to mint an admin token pair. */
export interface AdminTokenSubject {
  id: string;
  email: string;
  role: AdminRole;
  districtId: string | null;
  subDistrictId: string | null;
  country: AdminCountry | null;
}

/** A freshly-minted admin access/refresh token pair. */
export interface AdminTokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Sign a short-lived admin access token.
 *
 * @param subject Minimal admin identity + jurisdiction to embed in the token.
 * @returns A signed JWT string.
 */
export function signAdminAccessToken(subject: AdminTokenSubject): string {
  const claims: Omit<AdminTokenClaims, "sub"> = {
    email: subject.email,
    role: subject.role,
    districtId: subject.districtId,
    subDistrictId: subject.subDistrictId,
    country: subject.country,
    type: "access",
  };
  const options: SignOptions = {
    algorithm: ALGORITHM,
    subject: subject.id,
    expiresIn: env.ADMIN_JWT_ACCESS_EXPIRES as SignOptions["expiresIn"],
  };
  return jwt.sign(claims, env.ADMIN_JWT_ACCESS_SECRET, options);
}

/**
 * Sign a long-lived admin refresh token.
 *
 * @param subject Minimal admin identity to embed in the token.
 * @returns A signed JWT string.
 */
export function signAdminRefreshToken(subject: AdminTokenSubject): string {
  const claims: Omit<AdminTokenClaims, "sub"> = {
    email: subject.email,
    role: subject.role,
    districtId: subject.districtId,
    subDistrictId: subject.subDistrictId,
    country: subject.country,
    type: "refresh",
  };
  const options: SignOptions = {
    algorithm: ALGORITHM,
    subject: subject.id,
    expiresIn: env.ADMIN_JWT_REFRESH_EXPIRES as SignOptions["expiresIn"],
  };
  return jwt.sign(claims, env.ADMIN_JWT_REFRESH_SECRET, options);
}

/**
 * Sign both admin tokens at once.
 *
 * @param subject Minimal admin identity to embed in the tokens.
 * @returns An `{ accessToken, refreshToken }` pair.
 */
export function signAdminTokenPair(subject: AdminTokenSubject): AdminTokenPair {
  return {
    accessToken: signAdminAccessToken(subject),
    refreshToken: signAdminRefreshToken(subject),
  };
}

/**
 * Verify and decode an admin access token.
 *
 * @param token Raw access-token string.
 * @returns The decoded claims.
 * @throws {AppError} 401 when the token is missing, invalid, expired, or of
 *         the wrong type.
 */
export function verifyAdminAccessToken(token: string): DecodedAdminToken {
  return verify(token, env.ADMIN_JWT_ACCESS_SECRET, "access");
}

/**
 * Verify and decode an admin refresh token.
 *
 * @param token Raw refresh-token string.
 * @returns The decoded claims.
 * @throws {AppError} 401 when the token is missing, invalid, expired, or of
 *         the wrong type.
 */
export function verifyAdminRefreshToken(token: string): DecodedAdminToken {
  return verify(token, env.ADMIN_JWT_REFRESH_SECRET, "refresh");
}

/**
 * Internal verification routine shared by the access/refresh verifiers.
 *
 * @param token    Raw token string.
 * @param secret   Secret matching the token type.
 * @param expected Token flavour we require (`access` | `refresh`).
 * @returns The decoded claims.
 * @throws {AppError} 401 on any verification failure.
 */
function verify(
  token: string,
  secret: string,
  expected: AdminTokenClaims["type"],
): DecodedAdminToken {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: [ALGORITHM],
    }) as DecodedAdminToken;

    if (decoded.type !== expected) {
      throw new AppError("Invalid token type.", 401);
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid or expired token.", 401, { cause: error });
  }
}
