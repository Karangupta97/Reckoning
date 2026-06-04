import createMiddleware from "next-intl/middleware";

import { routing } from "./src/i18n/routing";

/**
 * next-intl locale routing.
 *
 * In Next.js 16 the `middleware` file convention was renamed to `proxy`. This
 * runs next-intl's locale negotiation: it detects the preferred locale from the
 * `Accept-Language` header (and persists it in the `RECKONING_LOCALE` cookie),
 * then rewrites/redirects locale-prefixed paths.
 */
export default createMiddleware(routing);

export const config = {
  /**
   * Only run on the localized landing experience.
   *
   * We deliberately exclude:
   *  - Next internals & static assets (`_next`, files with an extension)
   *  - The service worker, manifest and precached message catalogs
   *  - Existing non-localized app routes: `/login`, `/register`, `/verify-otp`,
   *    `/resend-otp`, `/report`, `/dashboard`, `/admin/**`, and `/api/**`
   *
   * The root `/` plus locale-prefixed roots (`/hi`, `/bn`, …) are matched so the
   * landing page gets locale negotiation while the app shell stays untouched.
   */
  matcher: [
    "/",
    "/(hi|bn|ne|si|th|my|dz|en)/:path*",
  ],
};
