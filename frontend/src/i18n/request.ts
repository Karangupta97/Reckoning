import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, type AppLocale, locales } from "./locales";
import { loadMessages, mergeMessages } from "./messages";

/**
 * Per-request next-intl configuration.
 *
 * The `requestLocale` comes from the matched `[locale]` segment. We narrow it to
 * a supported locale (falling back to `en`) and load the matching message
 * catalog. Catalogs are read from `public/messages/*.json` so the same files can
 * be precached by the Workbox service worker for offline use.
 *
 * The English catalog is deep-merged underneath the active locale, so any key
 * that hasn't been translated yet falls back to English instead of throwing a
 * missing-message error.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale = hasLocale(locales, requested)
    ? requested
    : defaultLocale;

  const base = await loadMessages(defaultLocale);
  const messages =
    locale === defaultLocale
      ? base
      : mergeMessages(base, await loadMessages(locale));

  return {
    locale,
    messages,
    timeZone: "Asia/Kolkata",
  };
});
