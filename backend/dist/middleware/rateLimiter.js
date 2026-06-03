/**
 * Per-route rate limiters.
 *
 * Backed by `express-rate-limit`. When `REDIS_URL` is configured the counters
 * are stored in Redis (via `rate-limit-redis`) so limits hold across multiple
 * app instances; otherwise the library's default in-memory store is used,
 * which is perfectly adequate for a single instance or local development.
 *
 * Redis wiring is performed lazily and defensively: if the optional `redis`
 * client package is not installed, or a connection cannot be established, the
 * limiters silently fall back to the memory store instead of crashing the
 * process. This keeps the auth endpoints protected in every environment.
 */
import rateLimit, { ipKeyGenerator, } from "express-rate-limit";
import { env } from "../config/env.js";
/** Standard JSON body returned when a client is rate-limited. */
const tooManyRequestsBody = {
    error: {
        message: "Too many requests. Please slow down and try again later.",
        statusCode: 429,
    },
};
/**
 * Lazily build a shared Redis store, or `undefined` to use the memory store.
 *
 * Resolves to `undefined` (memory store) when `REDIS_URL` is unset or when the
 * optional `redis` package / connection is unavailable.
 *
 * @returns A `rate-limit-redis` store, or `undefined` for the default store.
 */
async function buildRedisStore() {
    if (!env.REDIS_URL)
        return undefined;
    try {
        // Dynamic imports so the app does not hard-depend on these packages when
        // Redis is not in use. `redis` is an optional peer of this module.
        const [{ default: RedisStore }, { createClient }] = await Promise.all([
            import("rate-limit-redis"),
            // @ts-expect-error — `redis` is an optional dependency; types may be absent.
            import("redis"),
        ]);
        const client = createClient({ url: env.REDIS_URL });
        client.on("error", (error) => {
            // eslint-disable-next-line no-console
            console.error("[rateLimiter] Redis client error:", error);
        });
        await client.connect();
        // eslint-disable-next-line no-console
        console.log("[rateLimiter] Using Redis store for rate limiting.");
        return new RedisStore({
            sendCommand: (...args) => client.sendCommand(args),
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.warn("[rateLimiter] Redis store unavailable; falling back to in-memory store.", error instanceof Error ? error.message : error);
        return undefined;
    }
}
/**
 * Promise resolving to the shared store (or `undefined`). Evaluated once at
 * module load so all limiters share a single Redis connection.
 */
const sharedStorePromise = buildRedisStore();
/**
 * Create a configured limiter, injecting the shared store when ready.
 *
 * The store is attached asynchronously; until it resolves the limiter uses the
 * default memory store. In practice this resolves at startup, well before the
 * first request.
 *
 * @param windowMs      Rolling window length in milliseconds.
 * @param max           Maximum requests allowed per window per key.
 * @param keyGenerator  Optional custom key (defaults to IPv6-safe client IP).
 * @returns A configured Express rate-limit middleware.
 */
function makeLimiter(windowMs, max, keyGenerator) {
    const options = {
        windowMs,
        limit: max,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: tooManyRequestsBody,
        // When no custom key is given, omit `keyGenerator` so the library uses its
        // built-in IPv6-safe per-IP default. Express must have `trust proxy` set
        // correctly behind a proxy for this to reflect the real client IP.
        ...(keyGenerator ? { keyGenerator } : {}),
    };
    void sharedStorePromise.then((store) => {
        if (store)
            options.store = store;
    });
    return rateLimit(options);
}
/** Minute / hour constants in milliseconds for readable windows. */
const MINUTES = 60 * 1000;
/** `POST /api/auth/register` → 5 requests / 15 minutes / IP. */
export const registerLimiter = makeLimiter(15 * MINUTES, 5);
/** `POST /api/auth/verify-otp` → 10 requests / 15 minutes / IP. */
export const verifyOtpLimiter = makeLimiter(15 * MINUTES, 10);
/** `POST /api/auth/resend-otp` → 3 requests / 60 minutes / IP. */
export const resendOtpLimiter = makeLimiter(60 * MINUTES, 3);
/**
 * Derive a stable rate-limit key combining client IP and the login email.
 *
 * Mitigates targeted brute force against a single account from rotating IPs
 * is partially handled here by binding the email; the broad per-IP limiter
 * (`loginIpLimiter`) covers IP rotation. The IP portion uses the IPv6-safe
 * helper so a single client can't be split across many IPv6 addresses.
 *
 * @param req Express request (expects a validated `body.email`).
 * @returns The composite key, e.g. `"1.2.3.4:user@example.com"`.
 */
function ipEmailKey(req) {
    const ip = ipKeyGenerator(req.ip ?? "");
    const body = req.body;
    const email = body && typeof body.email === "string" ? body.email.toLowerCase() : "unknown";
    return `${ip}:${email}`;
}
/**
 * General per-IP login limiter → 10 requests / 15 minutes / IP.
 *
 * Apply BEFORE {@link loginEmailLimiter} so broad abuse is throttled first.
 */
export const loginIpLimiter = makeLimiter(15 * MINUTES, 10);
/**
 * Targeted per-IP+email login limiter → 5 requests / 15 minutes / IP+email.
 *
 * Blunts credential-stuffing against a specific account. Mount AFTER the body
 * has been parsed so `req.body.email` is available to the key generator.
 */
export const loginEmailLimiter = makeLimiter(15 * MINUTES, 5, ipEmailKey);
/** `POST /api/auth/refresh` → 20 requests / 15 minutes / IP. */
export const refreshLimiter = makeLimiter(15 * MINUTES, 20);
/** `POST /api/auth/logout` → 10 requests / 5 minutes / IP. */
export const logoutLimiter = makeLimiter(5 * MINUTES, 10);
// ---------------------------------------------------------------------------
// SmartReport limiters (upload + complaints)
// ---------------------------------------------------------------------------
/**
 * Derive a per-user rate-limit key, falling back to the IPv6-safe client IP
 * for unauthenticated requests. Mount AFTER `requireAuth` so `req.user` is
 * populated for the authenticated routes.
 *
 * @param req Express request (expects `req.user` on guarded routes).
 * @returns A stable key: the user id when present, else the client IP.
 */
function userOrIpKey(req) {
    const user = req.user;
    if (user?.id)
        return `user:${user.id}`;
    return ipKeyGenerator(req.ip ?? "");
}
/** Hour constant in milliseconds. */
const HOURS = 60 * MINUTES;
/** `POST /api/upload` → 20 uploads / hour / user. */
export const uploadRateLimiter = makeLimiter(1 * HOURS, 20, userOrIpKey);
/** `POST /api/complaints` → 10 submissions / hour / user. */
export const createComplaintLimiter = makeLimiter(1 * HOURS, 10, userOrIpKey);
/** `GET /api/complaints` → 60 requests / minute / IP. */
export const listComplaintsLimiter = makeLimiter(1 * MINUTES, 60);
// ---------------------------------------------------------------------------
// Admin realm limiters (onboarding + auth)
// ---------------------------------------------------------------------------
/**
 * Derive a per-admin rate-limit key, falling back to the IPv6-safe client IP
 * for unauthenticated requests. Mount AFTER `requireAdminAuth` so `req.admin`
 * is populated for guarded routes.
 *
 * @param req Express request (expects `req.admin` on guarded routes).
 * @returns A stable key: the admin id when present, else the client IP.
 */
function adminOrIpKey(req) {
    const admin = req.admin;
    if (admin?.id)
        return `admin:${admin.id}`;
    return ipKeyGenerator(req.ip ?? "");
}
/**
 * Invite limiter → 10 invites / hour / admin.
 *
 * Applies to both district and sub-district invite endpoints. Mount AFTER
 * `requireAdminAuth` so the key is the inviting admin's id.
 */
export const adminInviteLimiter = makeLimiter(1 * HOURS, 10, adminOrIpKey);
/** Admin general per-IP login limiter → 10 requests / 15 minutes / IP. */
export const adminLoginIpLimiter = makeLimiter(15 * MINUTES, 10);
/**
 * Targeted per-IP+email admin login limiter → 5 requests / 15 minutes.
 *
 * Mount AFTER body validation so `req.body.email` is available to the key.
 */
export const adminLoginEmailLimiter = makeLimiter(15 * MINUTES, 5, ipEmailKey);
/** `POST /api/admin/auth/refresh` → 20 requests / 15 minutes / IP. */
export const adminRefreshLimiter = makeLimiter(15 * MINUTES, 20);
/** `POST /api/admin/auth/logout` → 10 requests / 5 minutes / IP. */
export const adminLogoutLimiter = makeLimiter(5 * MINUTES, 10);
/** Admin account activation (public, token-based) → 10 / 15 minutes / IP. */
export const adminActivateLimiter = makeLimiter(15 * MINUTES, 10);
//# sourceMappingURL=rateLimiter.js.map