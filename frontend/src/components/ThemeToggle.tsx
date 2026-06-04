"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "RECKONING_THEME";

/** Applies the theme class to <html> and persists the choice. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

/**
 * Light/dark toggle switch.
 *
 * The initial theme is set before hydration by the inline script in the root
 * layout (reading localStorage / `prefers-color-scheme`), so this component just
 * reads the class already on <html> after mount and flips it on click. Rendering
 * is deferred until mounted to avoid a hydration mismatch on the icon/state.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={
        isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      onClick={toggle}
      // Before mount the rendered state may differ from the pre-hydration class;
      // suppress the warning for this single control.
      suppressHydrationWarning
      className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-1 transition-colors ${className}`}
    >
      {/* Track icons */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-[var(--color-text-muted)]">
        <Sun size={14} strokeWidth={2} aria-hidden="true" />
        <Moon size={14} strokeWidth={2} aria-hidden="true" />
      </span>

      {/* Sliding knob */}
      <span
        aria-hidden="true"
        className={`relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-amber)] shadow-[var(--shadow-neu)] transition-transform duration-300 ${
          mounted && isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {mounted && isDark ? (
          <Moon size={15} strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <Sun size={15} strokeWidth={2.25} aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
