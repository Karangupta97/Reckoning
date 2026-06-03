"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGES, useLanguage } from "./LanguageProvider";

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open, close]);

  return (
    <div className="rk-lang-toggle" ref={ref}>
      <button
        type="button"
        className="rk-lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <span className="rk-lang-btn-label">{language.native}</span>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="rk-lang-menu" role="listbox" aria-label="Languages">
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={language.code === lang.code}>
              <button
                type="button"
                className={`rk-lang-option${language.code === lang.code ? " active" : ""}`}
                onClick={() => {
                  setLanguage(lang);
                  close();
                }}
              >
                <span className="rk-lang-native">{lang.native}</span>
                <span className="rk-lang-english">{lang.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default memo(LanguageToggle);
