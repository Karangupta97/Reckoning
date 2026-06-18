/**
 * Baseline security response headers.
 *
 * A tiny, dependency-free middleware that sets the hardening headers required
 * by the auth spec on every response. If you later add `helmet`, you can mount
 * it instead/alongside — these headers are a strict subset of helmet's
 * defaults, so there is no conflict.
 */

import type { NextFunction, Request, Response } from "express";

/**
 * Apply baseline security headers to every response.
 *
 *   - `X-Content-Type-Options: nosniff`  — stop MIME-type sniffing.
 *   - `X-Frame-Options: DENY`            — disallow framing (clickjacking).
 *   - `Referrer-Policy: no-referrer`     — don't leak URLs cross-origin.
 *   - `X-DNS-Prefetch-Control: off`      — disable speculative DNS lookups.
 *
 * @example app.use(securityHeaders);
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  next();
}
