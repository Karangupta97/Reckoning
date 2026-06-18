"use client";

import { motion } from "framer-motion";

interface SettingsToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function SettingsToggle({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 min-h-[52px]">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] sm:text-sm font-medium text-[var(--color-text-primary)] leading-tight">
          {label}
        </p>
        {description && (
          <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex h-[26px] w-[46px] flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-amber)]
          ${disabled ? "opacity-40 cursor-not-allowed" : "active:scale-95"}
          ${enabled ? "bg-[var(--color-amber)]" : "bg-[var(--color-border)]"}
        `}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="pointer-events-none inline-block h-[22px] w-[22px] rounded-full bg-white shadow-md"
          style={{ marginTop: "0px" }}
        />
      </button>
    </div>
  );
}
