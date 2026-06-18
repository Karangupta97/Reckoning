import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * next-intl locale routing.
 *
 * In Next.js 16 the `middleware` file convention was renamed to `proxy`. Because
 * this app lives in `src/app`, the proxy file must sit at `src/proxy.ts` (next to
 * the `app` directory).
 *
 * It runs next-intl's locale negotiation: detecting the preferred locale from the
 * `Accept-Language` header (persisted in the `RECKONING_LOCALE` cookie), then
 * rewriting `/` to the default locale and handling locale-prefixed paths.
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
   * Matched:
   *  - `/` and `/analytics` (default-locale, unprefixed landing routes)
   *  - locale-prefixed roots (`/hi`, `/bn`, …) and their sub-paths
   */
  matcher: ["/", "/analytics", "/(hi|bn|ne|si|th|my|dz|en)/:path*"],
};
