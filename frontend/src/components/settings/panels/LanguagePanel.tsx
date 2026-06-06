"use client";

import { motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { useSettingsStore } from "../../../store/settingsStore";

const LANGUAGES = [
  { code: "en", name: "English", native: "English", available: true },
  { code: "hi", name: "Hindi", native: "हिन्दी", available: true },
  { code: "mr", name: "Marathi", native: "मराठी", available: true },
  { code: "bn", name: "Bengali", native: "বাংলা", available: true },
  { code: "ta", name: "Tamil", native: "தமிழ்", available: true },
  { code: "te", name: "Telugu", native: "తెలుగు", available: true },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", available: false },
  { code: "ml", name: "Malayalam", native: "മലയാളം", available: false },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", available: false },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", available: false },
  { code: "ne", name: "Nepali", native: "नेपाली", available: false },
  { code: "si", name: "Sinhala", native: "සිංහල", available: false },
  { code: "th", name: "Thai", native: "ไทย", available: false },
  { code: "my", name: "Burmese", native: "မြန်မာ", available: false },
  { code: "dz", name: "Dzongkha", native: "རྫོང་ཁ", available: false },
];

export function LanguagePanel() {
  const { language, setField } = useSettingsStore();

  return (
    <div>
      <SettingsSection title="App Language" description="Select your preferred language.">
        <div className="py-2 space-y-1">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  if (lang.available) setField("language", lang.code);
                }}
                disabled={!lang.available}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                  transition-all duration-200 min-h-[48px]
                  ${isSelected ? "bg-[var(--color-amber)]/8" : "hover:bg-[var(--color-surface)]/60"}
                  ${!lang.available ? "opacity-50" : ""}
                `}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium ${isSelected ? "text-[var(--color-amber)]" : "text-[var(--color-text-primary)]"}`}>
                    {lang.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{lang.native}</p>
                </div>

                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-[var(--color-amber)] flex items-center justify-center"
                  >
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </motion.span>
                )}
                {!lang.available && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] font-medium">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Offline Language Packs" description="Download languages for offline use.">
        <div className="py-3.5 space-y-2.5">
          {LANGUAGES.filter((l) => l.available).map((lang) => (
            <div key={lang.code} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{lang.name}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">~2.4 MB</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium
                text-[var(--color-amber)] border border-[var(--color-amber)]/30 rounded-lg
                hover:bg-[var(--color-amber)]/5 active:scale-95 transition-all duration-200">
                <Download size={12} />
                Download
              </button>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
