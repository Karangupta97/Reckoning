"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
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
  try {
    // Key must match root layout's THEME_INIT script which reads 'RECKONING_THEME'
    window.localStorage.setItem("RECKONING_THEME", resolved);
  } catch {
    // ignore
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
      mode: "dark",
      resolved: "dark",

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
        applyThemeToDOM(resolved);
        state.resolved = resolved;
      },
    }
  )
);
