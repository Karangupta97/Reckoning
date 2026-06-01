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
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";
/** Algorithm used for all tokens. */
const ALGORITHM = "HS256";
/**
 * Sign a short-lived access token for the given user.
 *
 * @param subject Minimal user identity to embed in the token.
 * @returns A signed JWT string.
 */
export function signAccessToken(subject) {
    const claims = {
        email: subject.email,
        role: subject.role,
        ...(subject.country ? { country: subject.country } : {}),
        type: "access",
    };
    const options = {
        algorithm: ALGORITHM,
        subject: subject.id,
        expiresIn: env.JWT_ACCESS_EXPIRES,
    };
    return jwt.sign(claims, env.JWT_ACCESS_SECRET, options);
}
/**
 * Sign a long-lived refresh token for the given user.
 *
 * @param subject Minimal user identity to embed in the token.
 * @returns A signed JWT string.
 */
export function signRefreshToken(subject) {
    const claims = {
        email: subject.email,
        role: subject.role,
        type: "refresh",
    };
    const options = {
        algorithm: ALGORITHM,
        subject: subject.id,
        expiresIn: env.JWT_REFRESH_EXPIRES,
    };
    return jwt.sign(claims, env.JWT_REFRESH_SECRET, options);
}
/**
 * Sign both tokens at once.
 *
 * @param subject Minimal user identity to embed in the tokens.
 * @returns An `{ accessToken, refreshToken }` pair.
 */
export function signTokenPair(subject) {
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
export function verifyAccessToken(token) {
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
export function verifyRefreshToken(token) {
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
function verify(token, secret, expected) {
    try {
        const decoded = jwt.verify(token, secret, {
            algorithms: [ALGORITHM],
        });
        if (decoded.type !== expected) {
            throw new AppError("Invalid token type.", 401);
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        throw new AppError("Invalid or expired token.", 401, { cause: error });
    }
}
//# sourceMappingURL=jwt.js.map