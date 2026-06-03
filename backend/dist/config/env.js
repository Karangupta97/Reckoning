/**
 * Environment configuration.
 *
 * All process.env access in the application MUST go through the `env` object
 * exported from this file. Values are validated with zod at startup; if any
 * required variable is missing or malformed the process exits with a
 * descriptive error so problems are caught immediately, not at runtime.
 */
import "dotenv/config";
import { z } from "zod";
/** Schema describing every environment variable the backend depends on. */
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z
        .string()
        .regex(/^\d+$/, "PORT must be a positive integer")
        .transform((value) => Number.parseInt(value, 10))
        .pipe(z.number().int().positive().max(65535))
        .default(8000),
    // PostgreSQL / Supabase connection strings
    DATABASE_URL: z
        .string()
        .url("DATABASE_URL must be a valid PostgreSQL connection URL"),
    DIRECT_URL: z
        .string()
        .url("DIRECT_URL must be a valid PostgreSQL connection URL"),
    // Supabase project + keys
    SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
    SUPABASE_ANON_KEY: z
        .string()
        .min(20, "SUPABASE_ANON_KEY looks too short to be valid"),
    SUPABASE_SERVICE_ROLE_KEY: z
        .string()
        .min(20, "SUPABASE_SERVICE_ROLE_KEY looks too short to be valid"),
    // Amazon SES (Nodemailer SMTP transport) — transactional email.
    // All five SMTP_*/EMAIL_FROM values are REQUIRED: the process refuses to
    // boot without them so a misconfigured mailer is caught immediately, never
    // at the moment a user is waiting on a verification code.
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required (e.g. email-smtp.ap-south-1.amazonaws.com)"),
    SMTP_PORT: z
        .string()
        .regex(/^\d+$/, "SMTP_PORT must be a positive integer (e.g. 587 or 465)")
        .transform((value) => Number.parseInt(value, 10))
        .pipe(z.number().int().positive().max(65535)),
    SMTP_USER: z.string().min(1, "SMTP_USER is required (your SES SMTP username)"),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required (your SES SMTP password)"),
    EMAIL_FROM: z
        .string()
        .email("EMAIL_FROM must be a valid, SES-verified email address"),
    // Display name shown alongside EMAIL_FROM, e.g. "RoadWatch AI" <noreply@…>.
    EMAIL_FROM_NAME: z.string().min(1).default("RoadWatch AI"),
    // Recipient for operational/admin alerts (new-complaint notifications).
    // Falls back to EMAIL_FROM when unset.
    ADMIN_EMAIL: z
        .string()
        .email("ADMIN_EMAIL must be a valid email address")
        .optional(),
    // Public base URL of the app, used to build links inside emails
    // (password reset, complaint tracking). No trailing slash.
    APP_BASE_URL: z
        .string()
        .url("APP_BASE_URL must be a valid URL")
        .default("https://roadwatch.ai"),
    // JWT signing secrets + lifetimes. Secrets must be long (>=64 chars) so the
    // HS256 HMAC key has adequate entropy. Access and refresh secrets MUST differ.
    JWT_ACCESS_SECRET: z
        .string()
        .min(64, "JWT_ACCESS_SECRET must be at least 64 characters"),
    JWT_REFRESH_SECRET: z
        .string()
        .min(64, "JWT_REFRESH_SECRET must be at least 64 characters"),
    JWT_ACCESS_EXPIRES: z.string().min(1).default("15m"),
    JWT_REFRESH_EXPIRES: z.string().min(1).default("7d"),
    // Admin auth realm — SEPARATE signing secrets from the citizen realm so a
    // leaked citizen token can never be replayed against admin endpoints (and
    // vice versa). Both must be >=64 chars and differ from each other AND from
    // the citizen secrets (enforced by the refinements below).
    ADMIN_JWT_ACCESS_SECRET: z
        .string()
        .min(64, "ADMIN_JWT_ACCESS_SECRET must be at least 64 characters"),
    ADMIN_JWT_REFRESH_SECRET: z
        .string()
        .min(64, "ADMIN_JWT_REFRESH_SECRET must be at least 64 characters"),
    ADMIN_JWT_ACCESS_EXPIRES: z.string().min(1).default("15m"),
    ADMIN_JWT_REFRESH_EXPIRES: z.string().min(1).default("7d"),
    // Public base URL the activation email links point at. The raw invite token
    // is appended as `?token=...`. No trailing slash.
    ADMIN_ACTIVATION_BASE_URL: z
        .string()
        .url("ADMIN_ACTIVATION_BASE_URL must be a valid URL")
        .default("https://roadwatch.ai/authority/activate"),
    // Super Admin bootstrap credentials, consumed ONLY by `prisma/seed.ts`.
    // The Super Admin can never be created through the API.
    SUPER_ADMIN_EMAIL: z
        .string()
        .email("SUPER_ADMIN_EMAIL must be a valid email address")
        .optional(),
    SUPER_ADMIN_PASSWORD: z
        .string()
        .min(10, "SUPER_ADMIN_PASSWORD must be at least 10 characters")
        .optional(),
    SUPER_ADMIN_FULL_NAME: z.string().min(2).max(80).optional(),
    // Pre-computed bcrypt hash of a throwaway string. Compared against during
    // login when no user is found, so response timing is identical whether or
    // not the email exists (timing-attack / user-enumeration prevention).
    DUMMY_HASH: z
        .string()
        .min(20, "DUMMY_HASH must be a valid bcrypt hash"),
    // Optional Redis connection. When present, rate-limit counters are shared
    // across instances via rate-limit-redis AND BullMQ background queues are
    // enabled; otherwise an in-memory store is used and queue producers no-op
    // (fine for a single instance / local dev).
    REDIS_URL: z
        .string()
        .url("REDIS_URL must be a valid redis:// connection URL")
        .optional(),
    // AWS S3 — media storage. Optional so the app still boots in environments
    // without object storage configured; the upload layer throws a clear,
    // operator-facing error if it is invoked while these are unset.
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    AWS_REGION: z.string().min(1).default("ap-south-1"),
    AWS_S3_BUCKET_NAME: z.string().min(1).optional(),
    // Nominatim (OpenStreetMap) reverse-geocoding. A descriptive User-Agent is
    // required by their usage policy. https://operations.osmfoundation.org/policies/nominatim/
    NOMINATIM_USER_AGENT: z
        .string()
        .min(1)
        .default("RoadWatchAI/1.0 (roadwatch@example.com)"),
    NOMINATIM_BASE_URL: z
        .string()
        .url("NOMINATIM_BASE_URL must be a valid URL")
        .default("https://nominatim.openstreetmap.org"),
})
    .refine((data) => data.JWT_ACCESS_SECRET !== data.JWT_REFRESH_SECRET, {
    message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different",
    path: ["JWT_REFRESH_SECRET"],
})
    .refine((data) => data.ADMIN_JWT_ACCESS_SECRET !== data.ADMIN_JWT_REFRESH_SECRET, {
    message: "ADMIN_JWT_ACCESS_SECRET and ADMIN_JWT_REFRESH_SECRET must be different",
    path: ["ADMIN_JWT_REFRESH_SECRET"],
})
    .refine((data) => data.ADMIN_JWT_ACCESS_SECRET !== data.JWT_ACCESS_SECRET, {
    message: "ADMIN_JWT_ACCESS_SECRET must differ from the citizen JWT_ACCESS_SECRET",
    path: ["ADMIN_JWT_ACCESS_SECRET"],
})
    .refine((data) => data.ADMIN_JWT_REFRESH_SECRET !== data.JWT_REFRESH_SECRET, {
    message: "ADMIN_JWT_REFRESH_SECRET must differ from the citizen JWT_REFRESH_SECRET",
    path: ["ADMIN_JWT_REFRESH_SECRET"],
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("\n");
    // eslint-disable-next-line no-console
    console.error(`\u274C Invalid environment configuration:\n${issues}\n\n` +
        `Make sure your .env file is present and complete. ` +
        `See .env.example for the required keys.`);
    process.exit(1);
}
/**
 * Validated, immutable environment object.
 *
 * Import this anywhere instead of reading `process.env` directly:
 *
 * ```ts
 * import { env } from "./config/env.js";
 * console.log(env.PORT);
 * ```
 */
export const env = Object.freeze(parsed.data);
/** Convenience flag: true when running in production mode. */
export const isProduction = env.NODE_ENV === "production";
/** Convenience flag: true when running in development mode. */
export const isDevelopment = env.NODE_ENV === "development";
//# sourceMappingURL=env.js.map