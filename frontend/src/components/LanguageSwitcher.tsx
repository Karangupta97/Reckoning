"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { localeList, type AppLocale } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";

const STORAGE_KEY = "RECKONING_LOCALE";

type Props = {
  /** Opens the dropdown upward (used in the footer). */
  dropUp?: boolean;
  className?: string;
};

/**
 * Flag + language-name dropdown. Persists the choice to localStorage and
 * navigates to the same path under the chosen locale.
 */
export function LanguageSwitcher({ dropUp = false, className = "" }: Props) {
  const t = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = localeList.find((l) => l.code === locale) ?? localeList[0];

  // Persist the active locale so it survives reloads / offline visits.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore storage failures (private mode, etc.).
    }
  }, [locale]);

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: AppLocale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore.
    }
    setOpen(false);
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("selectLanguage")}
        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {current.flag}
        </span>
        <span className="notranslate hidden sm:inline" translate="no" lang={current.code}>
          {current.nativeName}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("selectLanguage")}
          className={`absolute right-0 z-50 max-h-80 w-56 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-neu)] ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {localeList.map((item) => {
            const active = item.code === locale;
            return (
              <li key={item.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(item.code)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface)] ${
                    active
                      ? "bg-[var(--color-surface)] font-semibold"
                      : "font-medium"
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {item.flag}
                  </span>
                  <span className="flex flex-col">
                    <span
                      className="notranslate text-[var(--color-text-primary)]"
                      translate="no"
                      lang={item.code}
                    >
                      {item.nativeName}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {item.englishName}
                    </span>
                  </span>
                  {active && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="ml-auto text-[var(--color-amber)]"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
