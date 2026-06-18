"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return getSystemTheme();
  return mode;
}

export function applyThemeToDOM(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
  // Update CSS variables on root element for immediate effect
  if (resolved === "dark") {
    root.style.setProperty("--color-page", "#1A1F2E");
    root.style.setProperty("--color-text-primary", "#EDF1F7");
  } else {
    root.style.setProperty("--color-page", "#EFF2F9");
    root.style.setProperty("--color-text-primary", "#1C2B3A");
  }
  try {
    // Fast-path key: raw string read directly by the inline THEME_INIT script
    // to avoid re-parsing Zustand's JSON blob on every page load.
    window.localStorage.setItem("RECKONING_THEME_RESOLVED", resolved);
  } catch {
    // ignore — private browsing / storage quota
  }
}

interface ThemeStore {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  syncFromDOM: () => void;
  initSystemListener: () => () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: "light",
      resolved: "light",

      setMode: (mode) => {
        const resolved = resolveTheme(mode);
        applyThemeToDOM(resolved);
        set({ mode, resolved });
      },

      toggle: () => {
        const current = get().resolved;
        const next: ThemeMode = current === "dark" ? "light" : "dark";
        const resolved = resolveTheme(next);
        applyThemeToDOM(resolved);
        set({ mode: next, resolved });
      },

      syncFromDOM: () => {
        const stored = get().mode;
        const resolved = resolveTheme(stored);
        applyThemeToDOM(resolved);
        set({ resolved });
      },

      // Call once on app mount — returns cleanup
      initSystemListener: () => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
          const current = get().mode;
          if (current === "system") {
            const resolved = getSystemTheme();
            applyThemeToDOM(resolved);
            set({ resolved });
          }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      },
    }),
    {
      name: "RECKONING_THEME",
      partialize: (s) => ({ mode: s.mode }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const resolved = resolveTheme(state.mode);
        // Check if DOM already has the correct theme class to avoid unnecessary repaints
        const currentClass = document.documentElement.classList.contains("dark")
          ? "dark"
          : document.documentElement.classList.contains("light")
          ? "light"
          : null;
        // Only apply if different from what's currently in DOM
        if (currentClass !== resolved) {
          applyThemeToDOM(resolved);
        }
        state.resolved = resolved;
      },
    }
  )
);
