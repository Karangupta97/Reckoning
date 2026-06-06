"use client";

import { Smartphone } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { SettingsToggle } from "../SettingsToggle";
import { useSettingsStore } from "../../../store/settingsStore";

export function PrivacyPanel() {
  const {
    publicProfile,
    anonymousReporting,
    showLocation,
    allowMentions,
    twoFactorAuth,
    loginAlerts,
    setField,
  } = useSettingsStore();

  return (
    <div>
      <SettingsSection title="Profile Privacy" description="Control your public visibility.">
        <SettingsToggle
          label="Public Profile"
          description="Allow others to view your profile and reports"
          enabled={publicProfile}
          onChange={(v) => setField("publicProfile", v)}
        />
        <SettingsToggle
          label="Anonymous Reporting"
          description="Hide your identity on submitted reports"
          enabled={anonymousReporting}
          onChange={(v) => setField("anonymousReporting", v)}
        />
        <SettingsToggle
          label="Show Location"
          description="Display your general location on your profile"
          enabled={showLocation}
          onChange={(v) => setField("showLocation", v)}
        />
        <SettingsToggle
          label="Allow Mentions"
          description="Let community members mention you in posts"
          enabled={allowMentions}
          onChange={(v) => setField("allowMentions", v)}
        />
      </SettingsSection>

      <SettingsSection title="Security" description="Protect your account.">
        <SettingsToggle
          label="Two-Factor Authentication"
          description="Add an extra layer of security"
          enabled={twoFactorAuth}
          onChange={(v) => setField("twoFactorAuth", v)}
        />
        <SettingsToggle
          label="Login Alerts"
          description="Get notified of new sign-ins"
          enabled={loginAlerts}
          onChange={(v) => setField("loginAlerts", v)}
        />
        <div className="py-3.5">
          <button className="px-4 py-2.5 text-[13px] font-medium text-[var(--color-text-primary)]
            border border-[var(--color-border)] rounded-xl
            hover:bg-[var(--color-surface)] active:scale-95
            transition-all duration-200">
            Change Password
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Active Sessions">
        <div className="py-3.5 space-y-3">
          {/* Mock device sessions */}
          {[
            { name: "Chrome on Windows", location: "Pune, India", current: true },
            { name: "Safari on iPhone", location: "Pune, India", current: false },
          ].map((session) => (
            <div key={session.name} className="flex items-center gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]">
                <Smartphone size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  {session.name}
                  {session.current && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] font-semibold">
                      Current
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{session.location}</p>
              </div>
              {!session.current && (
                <button className="text-[11px] text-[var(--color-danger)] font-medium hover:underline">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
