"use client";

import { AlertTriangle, Flag, ShieldAlert } from "lucide-react";
import { SettingsSection } from "../SettingsSection";

export function AbusePanel() {
  return (
    <div>
      <SettingsSection title="Report Abuse" description="Report safety issues, harassment, or inappropriate content.">
        <div className="py-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/15 mb-4">
            <AlertTriangle size={18} className="text-[var(--color-danger)] shrink-0" />
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              If you are in immediate danger, please contact emergency services directly by calling 112.
            </p>
          </div>

          <div className="space-y-2.5">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
              text-left border border-[var(--color-border)]
              hover:bg-[var(--color-surface)] active:scale-[0.98] transition-all duration-200">
              <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]">
                <Flag size={16} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Report Inappropriate Content</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Flag posts, comments, or images</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
              text-left border border-[var(--color-border)]
              hover:bg-[var(--color-surface)] active:scale-[0.98] transition-all duration-200">
              <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]">
                <ShieldAlert size={16} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Report Harassment</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Report bullying or threats from a user</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
              text-left border border-[var(--color-border)]
              hover:bg-[var(--color-surface)] active:scale-[0.98] transition-all duration-200">
              <span className="shrink-0 w-9 h-9 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]">
                <AlertTriangle size={16} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">Report False Information</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Flag misleading or inaccurate reports</p>
              </div>
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
