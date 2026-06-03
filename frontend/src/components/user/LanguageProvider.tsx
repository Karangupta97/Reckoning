"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "si", label: "Sinhala", native: "සිංහල" },
  { code: "my", label: "Burmese", native: "မြန်မာ" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "dz", label: "Dzongkha", native: "རྫོང་ཁ" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
] as const;

export type Language = (typeof LANGUAGES)[number];

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const STORAGE_KEY = "reckoning-language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(LANGUAGES[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const match = LANGUAGES.find((l) => l.code === stored);
    if (match) setLanguageState(match);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, language.code);
    document.documentElement.lang = language.code;
  }, [language, mounted]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
