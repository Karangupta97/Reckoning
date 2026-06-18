"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

import { localeList, type AppLocale } from "@/i18n/locales";
import { useLocaleSwitch } from "@/components/dashboard/DashboardIntlProvider";

/**
 * Language switcher for the dashboard.
 * Switches locale client-side without page reload.
 */
export function DashboardLanguageSwitcher() {
  const { locale, switchLocale } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = localeList.find((l) => l.code === locale) ?? localeList[0];

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
    setOpen(false);
    switchLocale(next);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Globe size={15} />
        <span className="hidden md:inline text-xs font-medium" lang={current.code}>
          {current.nativeName}
        </span>
        <svg
          width="12"
          height="12"
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
          aria-label="Select language"
          className="absolute right-0 z-50 max-h-80 w-56 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-lg top-full mt-2"
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
                      className="text-[var(--color-text-primary)]"
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
