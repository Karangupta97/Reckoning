"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "RECKONING_THEME";
const TRANSITION_DURATION = 300; // ms — matches CSS

/**
 * Enables the global theme-transition class, applies the theme,
 * then removes the transition class after the animation completes.
 * This prevents transitions on initial page load (no FOUC) while
 * ensuring smooth switching when the user clicks the toggle.
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // Enable global theme transitions
  root.classList.add("theme-transition");

  // Apply theme
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;

  // Persist
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }

  // Remove transition class after animation completes to avoid
  // unwanted transitions on scroll, hover, focus etc.
  setTimeout(() => {
    root.classList.remove("theme-transition");
  }, TRANSITION_DURATION + 50);
}

/**
 * Premium theme toggle with:
 * - Spring-animated sliding knob
 * - 180° icon rotation on switch
 * - Glow effect
 * - Scale micro-interaction on press
 * - No flash on page load
 * - Accessible (role=switch, aria-checked)
 * - Respects prefers-reduced-motion
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const glowTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);

    // Trigger glow effect
    setGlowing(true);
    if (glowTimeout.current) clearTimeout(glowTimeout.current);
    glowTimeout.current = setTimeout(() => setGlowing(false), 600);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      suppressHydrationWarning
      className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-1 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-amber)] ${className}`}
      style={{
        transform: pressing ? "scale(0.92)" : "scale(1)",
        transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {/* Track background icons (static, decorative) */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2.5 text-[var(--color-text-muted)]">
        <Sun
          size={13}
          strokeWidth={2}
          aria-hidden="true"
          style={{ opacity: mounted && isDark ? 0.5 : 0.3 }}
        />
        <Moon
          size={13}
          strokeWidth={2}
          aria-hidden="true"
          style={{ opacity: mounted && !isDark ? 0.5 : 0.3 }}
        />
      </span>

      {/* Sliding knob with glow */}
      <span
        aria-hidden="true"
        className={`theme-toggle-knob theme-toggle-glow relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-card)] ${
          glowing
            ? isDark
              ? "theme-toggle-glow-dark"
              : "theme-toggle-glow-light"
            : ""
        }`}
        style={{
          transform: mounted && isDark ? "translateX(28px)" : "translateX(0px)",
          boxShadow: glowing
            ? undefined
            : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        {/* Icon with rotation */}
        <span
          className="theme-toggle-icon flex items-center justify-center"
          style={{
            transform: mounted && isDark ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          {mounted && isDark ? (
            <Moon
              size={14}
              strokeWidth={2.25}
              className="text-[var(--color-info)]"
              aria-hidden="true"
            />
          ) : (
            <Sun
              size={14}
              strokeWidth={2.25}
              className="text-[var(--color-amber)]"
              aria-hidden="true"
            />
          )}
        </span>
      </span>
    </button>
  );
}
