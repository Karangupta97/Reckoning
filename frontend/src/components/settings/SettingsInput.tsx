"use client";

import { useState } from "react";

interface SettingsInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function SettingsInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: SettingsInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="py-3">
      <label className="block text-[11px] sm:text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full h-11 px-3.5 rounded-xl text-sm
          bg-[var(--color-surface)] border
          text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
          transition-all duration-200
          ${focused ? "border-[var(--color-amber)] ring-2 ring-[var(--color-amber)]/20" : "border-[var(--color-border)]"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          focus:outline-none
        `}
      />
    </div>
  );
}
