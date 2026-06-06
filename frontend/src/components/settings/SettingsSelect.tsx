"use client";

import { ChevronDown } from "lucide-react";
import type { SettingsSelectOption } from "./types";

interface SettingsSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SettingsSelectOption[];
  description?: string;
}

export function SettingsSelect({
  label,
  value,
  onChange,
  options,
  description,
}: SettingsSelectProps) {
  return (
    <div className="py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] sm:text-sm font-medium text-[var(--color-text-primary)] leading-tight">
            {label}
          </p>
          {description && (
            <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5">
              {description}
            </p>
          )}
        </div>

        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none h-9 pl-3 pr-8 rounded-lg text-xs sm:text-sm font-medium
              bg-[var(--color-surface)] border border-[var(--color-border)]
              text-[var(--color-text-primary)]
              focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)]/20
              transition-all duration-200 cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
