/**
 * Auth service — all onboarding business logic.
 *
 * Pure(ish) functions operating on the database, OTP utilities, JWT helpers,
 * and the ElasticEmail service. Controllers stay thin and delegate everything here.
 * Every DB interaction is wrapped so failures surface as {@link AppError}
 * rather than leaking Prisma internals.
 *
 * Security invariants enforced here:
 *   - Passwords hashed with bcrypt (cost 12); never logged or returned.
 *   - OTPs hashed with bcrypt; only the hash is persisted; compared in
 *     constant time via bcrypt.compare.
 *   - OTP expiry is validated server-side against the DB timestamp.
 *   - Refresh tokens are stored only as SHA-256 hashes.
 */
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { sha256 } from "../../utils/hash.js";
import { compareOtp, generateOtp, hashOtp, otpExpiry, OTP_TTL_MINUTES, } from "../../utils/otp.js";
import { signAccessToken, signRefreshToken, signTokenPair, verifyRefreshToken, } from "../../utils/jwt.js";
import { sendOtpEmail } from "../../services/elasticemail.service.js";
/** bcrypt cost factor for password hashing. */
const PASSWORD_SALT_ROUNDS = 12;
/** Maximum failed OTP attempts before a pending verification is locked. */
const MAX_OTP_ATTEMPTS = 5;
/** Maximum OTP resends allowed per rolling window. */
const MAX_RESENDS_PER_WINDOW = 3;
/** Length of the resend window, in milliseconds (1 hour). */
const RESEND_WINDOW_MS = 60 * 60 * 1000;
/** Failed login attempts allowed before the account is locked. */
const MAX_LOGIN_ATTEMPTS = 5;
/** Account lockout duration, in milliseconds (15 minutes). */
const LOCKOUT_MS = 15 * 60 * 1000;
/** Access-token lifetime advertised to clients, in seconds (15 minutes). */
const ACCESS_EXPIRES_SECONDS = 900;
/** Refresh-token lifetime fallback, in milliseconds (7 days). */
const REFRESH_FALLBACK_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * Run a DB operation, converting unexpected Prisma/driver errors into a
 * generic 500 {@link AppError} while letting deliberate `AppError`s pass.
 *
 * @param operation Async DB work to execute.
 * @param context   Short label used in server-side logs.
 * @returns The operation's result.
 */
async function dbGuard(operation, context) {
    try {
        return await operation();
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        // eslint-disable-next-line no-console
        console.error(`[auth.service] DB error during ${context}:`, error);
        throw new AppError("A database error occurred. Please try again.", 500, {
            cause: error,
        });
    }
}
/**
 * Deterministically hash a refresh token for at-rest storage.
 *
 * Refresh tokens are high-entropy JWTs, so a fast SHA-256 digest is both safe
 * and convenient: it yields a unique, indexable value we can look up directly.
 *
 * @param token Raw refresh-token JWT.
 * @returns Hex-encoded SHA-256 digest.
 */
function hashRefreshToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
/**
 * Generate a fresh OTP, email it, and return its hash + expiry.
 *
 * Centralises the "issue an OTP" steps shared by register and resend so the
 * plaintext code never escapes this function except via the email.
 *
 * @param email    Recipient email.
 * @param fullName Recipient name (for the greeting).
 * @param country  BIMSTEC country code (for the greeting flag).
 * @returns The bcrypt OTP hash and its absolute expiry timestamp.
 */
async function issueOtp(email, fullName, country) {
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = otpExpiry();
    // Send only after hashing so an ElasticEmail failure doesn't persist a code we
    // never delivered (the caller persists after this resolves).
    await sendOtpEmail(email, fullName, otp, country);
    return { otpHash, expiresAt };
}
/**
 * Project a Prisma user row into the public-safe shape (no password hash).
 *
 * @param user Row with the fields needed for the projection.
 * @returns The client-safe user object.
 */
function toPublicUser(user) {
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        country: user.country,
        createdAt: user.createdAt,
    };
}
/**
 * STEP 1 — Register a new user and dispatch an OTP.
 *
 * Idempotent for unverified emails: if a pending verification already exists
 * it is refreshed (new OTP, new expiry) rather than erroring. Already-verified
 * emails are rejected with 409.
 *
 * @param input Validated registration payload.
 * @returns A dispatch result (never contains the OTP).
 * @throws {AppError} 409 if the email is already registered & verified.
 */
export async function register(input) {
    const { email, password, fullName, country } = input;
    const existingUser = await dbGuard(() => prisma.user.findUnique({ where: { email }, select: { id: true } }), "register:findUser");
    if (existingUser) {
        throw new AppError("This email is already registered. Please sign in.", 409);
    }
    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const { otpHash, expiresAt } = await issueOtp(email, fullName, country);
    await dbGuard(() => prisma.pendingVerification.upsert({
        where: { email },
        create: {
            email,
            otpHash,
            passwordHash,
            fullName,
            country,
            expiresAt,
            attempts: 0,
            resendCount: 0,
            resendWindowStart: new Date(),
            used: false,
        },
        update: {
            otpHash,
            passwordHash,
            fullName,
            country,
            expiresAt,
            attempts: 0,
            used: false,
            // Re-registration starts a fresh resend window.
            resendCount: 0,
            resendWindowStart: new Date(),
        },
    }), "register:upsertPending");
    return {
        message: "OTP sent to email",
        expiresInMinutes: OTP_TTL_MINUTES,
    };
}
/**
 * STEP 2 — Verify an OTP and activate the account.
 *
 * On success: creates the `User`, marks the pending verification used, issues
 * an access/refresh token pair, and stores the refresh token's hash — all in a
 * single transaction so the account and its session are created atomically.
 *
 * @param input Validated `{ email, otp }` payload.
 * @returns Tokens plus the public user object.
 * @throws {AppError} 400/410/429 on missing, used, expired, locked, or
 *         mismatched OTPs.
 */
export async function verifyOtp(input) {
    const { email, otp } = input;
    const pending = await dbGuard(() => prisma.pendingVerification.findUnique({ where: { email } }), "verifyOtp:findPending");
    if (!pending) {
        throw new AppError("No pending verification found for this email.", 404);
    }
    if (pending.used) {
        throw new AppError("This verification has already been completed.", 409);
    }
    if (pending.expiresAt.getTime() < Date.now()) {
        throw new AppError("This code has expired. Please request a new one.", 410);
    }
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
        throw new AppError("Too many incorrect attempts. Please request a new code.", 429);
    }
    const matches = await compareOtp(otp, pending.otpHash);
    if (!matches) {
        const attempts = await dbGuard(() => prisma.pendingVerification.update({
            where: { email },
            data: { attempts: { increment: 1 } },
            select: { attempts: true },
        }), "verifyOtp:incrementAttempts");
        const remaining = Math.max(0, MAX_OTP_ATTEMPTS - attempts.attempts);
        throw new AppError(remaining > 0
            ? `Incorrect code. ${remaining} attempt(s) remaining.`
            : "Incorrect code. You've been locked out — request a new code.", 400);
    }
    // Atomic activation: create user, consume pending record, persist session.
    const result = await dbGuard(() => prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: pending.email,
                fullName: pending.fullName,
                passwordHash: pending.passwordHash,
                country: pending.country,
                isVerified: true,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                country: true,
                role: true,
                createdAt: true,
            },
        });
        await tx.pendingVerification.update({
            where: { email },
            data: { used: true },
        });
        const tokens = signTokenPair({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const decoded = verifyRefreshToken(tokens.refreshToken);
        const refreshExpiresAt = decoded.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await tx.refreshToken.create({
            data: {
                tokenHash: hashRefreshToken(tokens.refreshToken),
                userId: user.id,
                expiresAt: refreshExpiresAt,
            },
        });
        return { user, tokens };
    }), "verifyOtp:activate").catch((error) => {
        // Unique violation = the email was activated by a concurrent request.
        if (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            throw new AppError("This email is already registered. Please sign in.", 409);
        }
        throw error;
    });
    return {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: toPublicUser(result.user),
    };
}
/**
 * STEP 3 — Resend an OTP for an in-progress registration.
 *
 * Enforces a DB-backed cap of {@link MAX_RESENDS_PER_WINDOW} resends per
 * rolling {@link RESEND_WINDOW_MS} window. Invalidates the previous OTP by
 * overwriting its hash and resets the 10-minute expiry.
 *
 * @param input Validated `{ email }` payload.
 * @returns A dispatch result (never contains the OTP).
 * @throws {AppError} 404 if no pending registration, 409 if already verified,
 *         429 if the hourly resend cap is exceeded.
 */
export async function resendOtp(input) {
    const { email } = input;
    const pending = await dbGuard(() => prisma.pendingVerification.findUnique({ where: { email } }), "resendOtp:findPending");
    if (!pending) {
        throw new AppError("No pending registration found for this email.", 404);
    }
    if (pending.used) {
        throw new AppError("This account is already verified. Please sign in.", 409);
    }
    // Rolling-window resend cap, enforced in the DB.
    const now = Date.now();
    const windowStart = pending.resendWindowStart?.getTime() ?? 0;
    const windowExpired = now - windowStart > RESEND_WINDOW_MS;
    const nextResendCount = windowExpired ? 1 : pending.resendCount + 1;
    if (!windowExpired && pending.resendCount >= MAX_RESENDS_PER_WINDOW) {
        throw new AppError("Resend limit reached. Please wait up to an hour before trying again.", 429);
    }
    const { otpHash, expiresAt } = await issueOtp(pending.email, pending.fullName, pending.country);
    await dbGuard(() => prisma.pendingVerification.update({
        where: { email },
        data: {
            otpHash,
            expiresAt,
            attempts: 0,
            resendCount: nextResendCount,
            resendWindowStart: windowExpired ? new Date() : pending.resendWindowStart,
        },
    }), "resendOtp:updatePending");
    return {
        message: "OTP sent to email",
        expiresInMinutes: OTP_TTL_MINUTES,
    };
}
// ---------------------------------------------------------------------------
// Login / session management
// ---------------------------------------------------------------------------
/** Generic auth-failure error reused everywhere to prevent user enumeration. */
function invalidCredentials() {
    return new AppError("Invalid email or password", 401, {
        code: "INVALID_CREDENTIALS",
    });
}
/** Columns selected for the authenticated user shape (never `passwordHash`). */
const AUTH_USER_SELECT = {
    id: true,
    email: true,
    fullName: true,
    country: true,
    role: true,
    createdAt: true,
    lastLoginAt: true,
};
/**
 * Compute a refresh token's absolute expiry from its decoded `exp`, falling
 * back to a fixed 7-day window if the claim is somehow absent.
 *
 * @param token Signed refresh-token JWT.
 * @returns The expiry `Date`.
 */
function refreshExpiryOf(token) {
    const decoded = verifyRefreshToken(token);
    return decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + REFRESH_FALLBACK_MS);
}
/**
 * Persist a freshly-issued refresh token (as a SHA-256 hash) with session
 * metadata. The raw token is never stored.
 *
 * @param tx           Prisma client or transaction client.
 * @param userId       Owner user id.
 * @param refreshToken Raw refresh-token JWT (hashed before storage).
 * @param ctx          Request context (IP / user-agent).
 * @param deviceInfo   Optional client-reported device metadata.
 */
async function storeRefreshToken(tx, userId, refreshToken, ctx, deviceInfo) {
    await tx.refreshToken.create({
        data: {
            tokenHash: sha256(refreshToken),
            userId,
            expiresAt: refreshExpiryOf(refreshToken),
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.userAgent ?? null,
            deviceInfo: deviceInfo ? deviceInfo : Prisma.JsonNull,
        },
    });
}
/**
 * STEP 1 — Authenticate a user with email + password.
 *
 * Implements timing-attack resistance (always runs a bcrypt compare, even for
 * unknown emails), user-enumeration resistance (one generic failure message),
 * and DB-backed account lockout (5 failures → 15-minute lock).
 *
 * @param input Validated login body.
 * @param ctx   Request context (IP / user-agent) for session auditing.
 * @returns Tokens + the authenticated user projection.
 * @throws {AppError} 401 INVALID_CREDENTIALS, 403 EMAIL_NOT_VERIFIED,
 *         423 ACCOUNT_LOCKED.
 */
export async function login(input, ctx) {
    const { email, password, deviceInfo } = input;
    const user = await dbGuard(() => prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            fullName: true,
            country: true,
            role: true,
            passwordHash: true,
            isVerified: true,
            loginAttempts: true,
            lockedUntil: true,
            createdAt: true,
            lastLoginAt: true,
        },
    }), "login:findUser");
    // Unknown email: burn the equivalent time on a dummy compare, then fail with
    // the SAME generic error so existence can't be inferred from timing/message.
    if (!user) {
        await bcrypt.compare(password, env.DUMMY_HASH);
        throw invalidCredentials();
    }
    // Account currently locked? Report remaining minutes (this is acceptable to
    // expose: the user already proved knowledge of the email earlier).
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        const minutesRemaining = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000));
        throw new AppError(`Account temporarily locked. Try again in ${minutesRemaining} minutes.`, 423, { code: "ACCOUNT_LOCKED", meta: { minutesRemaining } });
    }
    if (!user.isVerified) {
        throw new AppError("Email not verified. Please verify your account first.", 403, { code: "EMAIL_NOT_VERIFIED" });
    }
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
        const attempts = user.loginAttempts + 1;
        const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS;
        await dbGuard(() => prisma.user.update({
            where: { id: user.id },
            data: {
                loginAttempts: attempts,
                lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
            },
        }), "login:incrementAttempts");
        // Always the same generic error, even at the moment of locking.
        throw invalidCredentials();
    }
    // Success: reset the failure counter, clear any lock, stamp lastLoginAt, and
    // persist a rotated session — atomically.
    const now = new Date();
    const tokens = signTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
        country: user.country,
    });
    const authUser = await dbGuard(() => prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: now },
            select: AUTH_USER_SELECT,
        });
        await storeRefreshToken(tx, user.id, tokens.refreshToken, ctx, deviceInfo);
        return updated;
    }), "login:finalize");
    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: ACCESS_EXPIRES_SECONDS,
        tokenType: "Bearer",
        user: authUser,
    };
}
/**
 * STEP 2 — Rotate tokens using a valid refresh token.
 *
 * Verifies the JWT signature, confirms the hashed token is present, unused,
 * unexpired, and owned by the JWT subject, then revokes it and issues a brand
 * new pair (refresh-token rotation). A revoked-but-presented token is treated
 * as a failure (possible theft/replay).
 *
 * @param refreshToken Raw refresh-token JWT from the request body.
 * @param ctx          Request context (IP / user-agent) for the new session.
 * @returns A new access/refresh pair and the access lifetime.
 * @throws {AppError} 401 INVALID_REFRESH_TOKEN / TOKEN_EXPIRED.
 */
export async function refresh(refreshToken, ctx) {
    // 1. Verify signature + type. `verifyRefreshToken` throws AppError(401).
    const decoded = verifyRefreshToken(refreshToken);
    const userId = decoded.sub;
    if (!userId) {
        throw new AppError("Invalid refresh token.", 401, {
            code: "INVALID_REFRESH_TOKEN",
        });
    }
    // 2. Look up the stored hash.
    const tokenHash = sha256(refreshToken);
    const stored = await dbGuard(() => prisma.refreshToken.findUnique({ where: { tokenHash } }), "refresh:findToken");
    // 3. Validate: exists, not revoked, unexpired, owner matches the JWT subject.
    if (!stored ||
        stored.revoked ||
        stored.expiresAt.getTime() <= Date.now() ||
        stored.userId !== userId) {
        throw new AppError("Invalid refresh token.", 401, {
            code: "INVALID_REFRESH_TOKEN",
        });
    }
    // 4. Ensure the user still exists and is still verified.
    const user = await dbGuard(() => prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, country: true, isVerified: true },
    }), "refresh:findUser");
    if (!user || !user.isVerified) {
        throw new AppError("Invalid refresh token.", 401, {
            code: "INVALID_REFRESH_TOKEN",
        });
    }
    // 5-7. Rotate: revoke the old token and persist the new one atomically.
    const accessToken = signAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
        country: user.country,
    });
    const newRefreshToken = signRefreshToken({
        id: user.id,
        email: user.email,
        role: user.role,
        country: user.country,
    });
    await dbGuard(() => prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({
            where: { tokenHash },
            data: { revoked: true, revokedAt: new Date() },
        });
        await storeRefreshToken(tx, user.id, newRefreshToken, ctx);
    }), "refresh:rotate");
    return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_EXPIRES_SECONDS,
    };
}
/**
 * STEP 3 — Log out the current device or every device.
 *
 * Revoking is idempotent: revoking an unknown/already-revoked token is a
 * silent success so logout never leaks token validity.
 *
 * @param input Authenticated user id plus revoke target.
 * @returns A confirmation message.
 */
export async function logout(input) {
    const { userId, refreshToken, allDevices } = input;
    if (allDevices) {
        await dbGuard(() => prisma.refreshToken.updateMany({
            where: { userId, revoked: false },
            data: { revoked: true, revokedAt: new Date() },
        }), "logout:allDevices");
    }
    else if (refreshToken) {
        await dbGuard(() => prisma.refreshToken.updateMany({
            // Scope by userId so one user can't revoke another's token.
            where: { tokenHash: sha256(refreshToken), userId, revoked: false },
            data: { revoked: true, revokedAt: new Date() },
        }), "logout:singleDevice");
    }
    return { message: "Logged out successfully" };
}
/**
 * STEP 4 — Fetch the authenticated user's fresh profile.
 *
 * Reads from the DB rather than trusting the token payload, so role/country
 * changes take effect immediately and revoked accounts are caught.
 *
 * @param userId Authenticated user id (from `req.user`).
 * @returns The current user projection.
 * @throws {AppError} 404 USER_NOT_FOUND when the account no longer exists.
 */
export async function getMe(userId) {
    const user = await dbGuard(() => prisma.user.findUnique({ where: { id: userId }, select: AUTH_USER_SELECT }), "getMe:findUser");
    if (!user) {
        throw new AppError("User not found.", 404, { code: "USER_NOT_FOUND" });
    }
    return user;
}
//# sourceMappingURL=auth.service.js.map