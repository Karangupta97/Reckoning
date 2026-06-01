/**
 * Global Express error handler + 404 handler.
 *
 * Centralises error-to-HTTP translation and enforces the API's standard
 * response envelope:
 *
 * ```json
 * { "success": false, "error": { "code": "SNAKE_CASE", "message": "..." } }
 * ```
 *
 *   - {@link AppError}    → its own `statusCode`, `code`, `message`, plus any
 *                           `meta` fields (e.g. `minutesRemaining`) and Zod
 *                           `details`.
 *   - Everything else     → 500 `INTERNAL_ERROR` with a generic message
 *                           (no internals leaked).
 *
 * Stack traces are logged server-side always, but only included in the JSON
 * response outside production.
 */

import type { ErrorRequestHandler, RequestHandler } from "express";
import { isProduction } from "../config/env.js";
import { AppError, type FieldError } from "../utils/AppError.js";

/** The `error` object inside the standard failure envelope. */
interface ErrorPayload {
  code: string;
  message: string;
  details?: ReadonlyArray<FieldError>;
  /** Only present outside production, for debugging. */
  stack?: string;
  /** Arbitrary client-safe extras merged from `AppError.meta`. */
  [key: string]: unknown;
}

/** Standard failure envelope returned to clients. */
interface ErrorResponseBody {
  success: false;
  error: ErrorPayload;
}

/** Fallback machine-readable codes per HTTP status when none is supplied. */
const DEFAULT_CODES: Readonly<Record<number, string>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  410: "GONE",
  423: "LOCKED",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
};

/**
 * Resolve a machine-readable error code for a status when one isn't explicit.
 *
 * @param statusCode HTTP status code.
 * @returns A SNAKE_CASE code, defaulting to `INTERNAL_ERROR`.
 */
function codeForStatus(statusCode: number): string {
  return DEFAULT_CODES[statusCode] ?? "INTERNAL_ERROR";
}

/**
 * 404 handler for unmatched routes. Mount AFTER all real routes.
 *
 * @example app.use(notFoundHandler);
 */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, {
      code: "NOT_FOUND",
    }),
  );
};

/**
 * Terminal Express error-handling middleware. Mount LAST, after routes and
 * the 404 handler.
 *
 * Express identifies this as an error handler by its four-argument arity, so
 * `next` must remain in the signature even though it is unused.
 *
 * @example app.use(errorHandler);
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isApp = err instanceof AppError;
  const statusCode = isApp ? err.statusCode : 500;

  // Always log server-side. Unexpected (non-operational) errors get the full
  // object so we can debug; operational ones log just enough for an audit.
  if (!isApp || statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[error]", err);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[error] ${statusCode} ${(err as Error).message}`);
  }

  const message = isApp
    ? err.message
    : "Something went wrong. Please try again later.";

  const error: ErrorPayload = {
    code: isApp && err.code ? err.code : codeForStatus(statusCode),
    message,
    ...(isApp && err.meta ? err.meta : {}),
    ...(isApp && err.details ? { details: err.details } : {}),
    ...(!isProduction && err instanceof Error && err.stack
      ? { stack: err.stack }
      : {}),
  };

  const body: ErrorResponseBody = { success: false, error };
  res.status(statusCode).json(body);
};
