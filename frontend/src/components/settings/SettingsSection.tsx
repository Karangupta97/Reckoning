"use client";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 px-1">
        <h3 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {title}
        </h3>
        {description && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] px-4 shadow-sm">
        {children}
      </div>
    </div>
  );
}
