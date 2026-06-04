import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./locales";

/**
 * next-intl routing config.
 *
 * `localePrefix: "as-needed"` keeps the default locale (`en`) unprefixed at `/`
 * while other locales live at `/hi`, `/bn`, etc. The existing non-localized app
 * routes (`/login`, `/report`, `/dashboard`, `/admin/**`) are excluded from the
 * proxy matcher, so they keep working untouched.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  // Persist + detect the locale from the Accept-Language header / cookie.
  localeDetection: true,
  localeCookie: {
    name: "RECKONING_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});
