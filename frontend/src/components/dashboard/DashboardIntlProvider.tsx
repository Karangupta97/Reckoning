"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";

import { type AppLocale, defaultLocale, locales } from "@/i18n/locales";

const COOKIE_NAME = "RECKONING_LOCALE";
const STORAGE_KEY = "RECKONING_LOCALE";

type IntlContextType = {
  locale: AppLocale;
  switchLocale: (next: AppLocale) => void;
};

const IntlContext = createContext<IntlContextType>({
  locale: defaultLocale,
  switchLocale: () => {},
});

export function useLocaleSwitch() {
  return useContext(IntlContext);
}

type Props = {
  initialLocale: string;
  initialMessages: Record<string, unknown>;
  children: React.ReactNode;
};

/**
 * Client-side intl provider that allows locale switching without page reload.
 * Fetches message catalogs from /messages/<locale>.json and swaps them in place.
 */
export function DashboardIntlProvider({ initialLocale, initialMessages, children }: Props) {
  const [locale, setLocale] = useState<AppLocale>(
    locales.includes(initialLocale as AppLocale) ? (initialLocale as AppLocale) : defaultLocale
  );
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages);

  const switchLocale = useCallback(async (next: AppLocale) => {
    if (next === locale) return;

    try {
      // Fetch the base (English) and target locale messages
      const [baseRes, targetRes] = await Promise.all([
        fetch(`/messages/${defaultLocale}.json`),
        next !== defaultLocale ? fetch(`/messages/${next}.json`) : null,
      ]);

      const baseMessages = await baseRes.json();
      const targetMessages = targetRes ? await targetRes.json() : null;

      // Deep merge: target on top of base (same as server logic)
      const merged = targetMessages ? deepMerge(baseMessages, targetMessages) : baseMessages;

      // Persist to cookie and localStorage
      document.cookie = `${COOKIE_NAME}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore.
      }

      setMessages(merged);
      setLocale(next);

      // Update the html lang attribute
      document.documentElement.lang = next;
    } catch (err) {
      console.error("Failed to switch locale:", err);
    }
  }, [locale]);

  // On mount, check if cookie/localStorage has a different locale than what was server-rendered
  useEffect(() => {
    const stored = getCookieLocale() || getStoredLocale();
    if (stored && stored !== locale && locales.includes(stored as AppLocale)) {
      switchLocale(stored as AppLocale);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <IntlContext.Provider value={{ locale, switchLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Kolkata">
        {children}
      </NextIntlClientProvider>
    </IntlContext.Provider>
  );
}

function getCookieLocale(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

function getStoredLocale(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };

  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = base[key];

    if (
      o && b &&
      typeof o === "object" && typeof b === "object" &&
      !Array.isArray(o) && !Array.isArray(b)
    ) {
      out[key] = deepMerge(b as Record<string, unknown>, o as Record<string, unknown>);
    } else if (o !== undefined && o !== "") {
      out[key] = o;
    }
  }

  return out;
}
