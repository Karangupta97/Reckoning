"use client";

import { useState } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { useAuth } from "@/hooks/useAuth";

export function LogoutPanel() {
  const { logout, isLoading: isLoggingOut } = useAuth();
  const [confirmed, setConfirmed] = useState(false);

  const handleLogout = async () => {
    setConfirmed(true);
    await logout();
  };

  return (
    <div>
      <SettingsSection title="Sign Out" description="Log out of your Reckoning account.">
        <div className="py-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-amber)]/10 flex items-center justify-center mb-4">
            <LogOut size={24} className="text-[var(--color-amber)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            Sign out of Reckoning?
          </h3>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-5 max-w-xs">
            You will need to sign in again to access your reports and community features.
          </p>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-amber)]/5 border border-[var(--color-amber)]/15 mb-5 w-full max-w-sm">
            <AlertTriangle size={14} className="text-[var(--color-amber)] shrink-0" />
            <p className="text-[11px] text-[var(--color-text-secondary)] text-left">
              Any pending reports not yet synced will be saved locally and submitted when you sign back in.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmed(false)}
              disabled={isLoggingOut}
              className="px-5 py-2.5 text-[13px] font-medium text-[var(--color-text-secondary)]
                border border-[var(--color-border)] rounded-xl
                hover:bg-[var(--color-surface)] active:scale-95 transition-all duration-200
                disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-5 py-2.5 text-[13px] font-semibold text-white
                bg-[var(--color-danger)] rounded-xl
                hover:brightness-110 active:scale-95 transition-all duration-200 shadow-sm
                disabled:opacity-60"
            >
              {isLoggingOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
