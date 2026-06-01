/**
 * JSON Web Token helpers.
 *
 * Two distinct token types are issued, signed with two distinct secrets so a
 * leaked access token can never be replayed as a refresh token (and vice
 * versa). All tokens use HS256.
 *
 *   - Access token  — short-lived (default 15m), sent on every request.
 *   - Refresh token — long-lived  (default 7d), exchanged for a new access
 *                      token. Only a HASH of the refresh token is stored in
 *                      the DB; the raw token lives client-side only.
 */

import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

/** Roles mirrored from the Prisma `Role` enum (kept local to avoid a cycle). */
export type UserRole = "CITIZEN" | "AUTHORITY" | "ADMIN";

/** Countries mirrored from the Prisma `Country` enum (kept local to avoid a cycle). */
export type UserCountry =
  | "INDIA"
  | "BANGLADESH"
  | "NEPAL"
  | "SRI_LANKA"
  | "MYANMAR"
  | "THAILAND"
  | "BHUTAN";

/** Custom claims embedded in every RoadWatch AI token. */
export interface TokenClaims {
  /** User id (also set as the JWT `sub`). */
  sub: string;
  /** User email. */
  email: string;
  /** User role. */
  role: UserRole;
  /** User country (present on access tokens). */
  country?: UserCountry;
  /** Token flavour, used to reject cross-use of access/refresh tokens. */
  type: "access" | "refresh";
}

/** Fully-decoded token: our claims plus the standard registered claims. */
export type DecodedToken = TokenClaims & JwtPayload;

/** Algorithm used for all tokens. */
const ALGORITHM = "HS256" as const;

/** Shape of the data needed to mint a token pair. */
export interface TokenSubject {
  id: string;
  email: string;
  role: UserRole;
  country?: UserCountry;
}

/** A freshly-minted access/refresh token pair. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Sign a short-lived access token for the given user.
 *
 * @param subject Minimal user identity to embed in the token.
 * @returns A signed JWT string.
 */
export function signAccessToken(subject: TokenSubject): string {
  const claims: Omit<TokenClaims, "sub"> = {
    email: subject.email,
    role: subject.role,
    ...(subject.country ? { country: subject.country } : {}),
    type: "access",
  };
  const options: SignOptions = {
    algorithm: ALGORITHM,
    subject: subject.id,
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"],
  };
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, options);
}

/**
 * Sign a long-lived refresh token for the given user.
 *
 * @param subject Minimal user identity to embed in the token.
 * @returns A signed JWT string.
 */
export function signRefreshToken(subject: TokenSubject): string {
  const claims: Omit<TokenClaims, "sub"> = {
    email: subject.email,
    role: subject.role,
    type: "refresh",
  };
  const options: SignOptions = {
    algorithm: ALGORITHM,
    subject: subject.id,
    expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions["expiresIn"],
  };
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, options);
}

/**
 * Sign both tokens at once.
 *
 * @param subject Minimal user identity to embed in the tokens.
 * @returns An `{ accessToken, refreshToken }` pair.
 */
export function signTokenPair(subject: TokenSubject): TokenPair {
  return {
    accessToken: signAccessToken(subject),
    refreshToken: signRefreshToken(subject),
  };
}

/**
 * Verify and decode an access token.
 *
 * @param token Raw access-token string.
 * @returns The decoded claims.
 * @throws {AppError} 401 when the token is missing, invalid, expired, or of
 *         the wrong type.
 */
export function verifyAccessToken(token: string): DecodedToken {
  return verify(token, env.JWT_ACCESS_SECRET, "access");
}

/**
 * Verify and decode a refresh token.
 *
 * @param token Raw refresh-token string.
 * @returns The decoded claims.
 * @throws {AppError} 401 when the token is missing, invalid, expired, or of
 *         the wrong type.
 */
export function verifyRefreshToken(token: string): DecodedToken {
  return verify(token, env.JWT_REFRESH_SECRET, "refresh");
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
  expected: TokenClaims["type"],
): DecodedToken {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: [ALGORITHM],
    }) as DecodedToken;

    if (decoded.type !== expected) {
      throw new AppError("Invalid token type.", 401);
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid or expired token.", 401, { cause: error });
  }
}
