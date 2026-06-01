/**
 * Fast cryptographic hashing helpers.
 *
 * Used for refresh tokens, which are high-entropy random JWTs. A SHA-256
 * digest is appropriate here (unlike passwords) because:
 *
 *   - The input already has high entropy, so brute-forcing the preimage is
 *     infeasible — no slow KDF / salt is needed.
 *   - Lookups must be fast and deterministic so we can index `tokenHash` and
 *     find a stored token by hashing the incoming one.
 *
 * NEVER use these helpers for passwords — use bcrypt for those.
 */
import { createHash, timingSafeEqual } from "node:crypto";
/**
 * Compute the hex-encoded SHA-256 digest of a string.
 *
 * @param value Raw input (e.g. a refresh-token JWT).
 * @returns Lower-case hex digest, 64 characters long.
 */
export function sha256(value) {
    return createHash("sha256").update(value).digest("hex");
}
/**
 * Constant-time comparison of two hex digests of equal length.
 *
 * Avoids leaking how many leading characters matched via response timing.
 * Returns `false` for length mismatches (which also implies inequality).
 *
 * @param a First hex digest.
 * @param b Second hex digest.
 * @returns `true` when the digests are identical, `false` otherwise.
 */
export function safeEqualHex(a, b) {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length || bufA.length === 0)
        return false;
    return timingSafeEqual(bufA, bufB);
}
//# sourceMappingURL=hash.js.map