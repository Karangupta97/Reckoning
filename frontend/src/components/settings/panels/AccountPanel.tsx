"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Loader2, RotateCcw, Save } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { SettingsInput } from "../SettingsInput";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

const COUNTRY_LABELS: Record<string, string> = {
  INDIA: "India",
  BANGLADESH: "Bangladesh",
  NEPAL: "Nepal",
  SRI_LANKA: "Sri Lanka",
  MYANMAR: "Myanmar",
  THAILAND: "Thailand",
  BHUTAN: "Bhutan",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AccountPanel() {
  const user = useAuthStore((state) => state.user);
  const { updateCitizenProfile, isLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("INDIA");
  const [isDirty, setIsDirty] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setFullName(user.fullName);
    setCountry(user.country);
    setIsDirty(false);
    setSuccessMessage(null);
    clearError();
  }, [clearError, user]);

  const initials = useMemo(() => getInitials(user?.fullName ?? "User"), [user?.fullName]);

  const resetForm = () => {
    if (!user) return;

    setFullName(user.fullName);
    setCountry(user.country);
    setIsDirty(false);
    setSuccessMessage(null);
    clearError();
  };

  const handleSave = async () => {
    if (!user) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      return;
    }

    setSuccessMessage(null);

    try {
      const updated = await updateCitizenProfile({
        fullName: trimmedName,
        country: country as typeof user.country,
      });

      setFullName(updated.fullName);
      setCountry(updated.country);
      setIsDirty(false);
      setSuccessMessage("Profile updated successfully.");
    } catch {
      // The hook already surfaces a safe error message.
    }
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <SettingsSection title="Profile" description="Loading your account details.">
          <div className="py-10 flex items-center justify-center text-[var(--color-text-muted)]">
            <Loader2 size={18} className="animate-spin" />
          </div>
        </SettingsSection>
      </div>
    );
  }

  return (
    <div>
      <SettingsSection title="Profile Photo">
        <div className="py-4 flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-amber)] to-orange-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {initials}
            </div>
            <button
              className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200"
              aria-label="Change profile photo"
            >
              <Camera size={18} className="text-white" />
            </button>
          </div>
          <div>
            <button className="px-3.5 py-2 text-xs font-medium text-[var(--color-amber)] border border-[var(--color-amber)]/30 rounded-lg hover:bg-[var(--color-amber)]/5 active:scale-95 transition-all duration-200">
              Upload Photo
            </button>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
              JPG, PNG or WebP. Max 5MB.
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Personal Information" description="Your account details from the backend.">
        <SettingsInput
          label="Full Name"
          value={fullName}
          onChange={(value) => {
            setFullName(value);
            setIsDirty(true);
            clearError();
            setSuccessMessage(null);
          }}
          placeholder="Enter your full name"
        />
        <SettingsInput
          label="Email Address"
          value={user.email}
          onChange={() => undefined}
          type="email"
          placeholder="your@email.com"
          disabled
        />
        <div className="py-3">
          <label className="block text-[11px] sm:text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Country
          </label>
          <select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setIsDirty(true);
              clearError();
              setSuccessMessage(null);
            }}
            className="w-full h-11 px-3.5 rounded-xl text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-amber)] focus:ring-2 focus:ring-[var(--color-amber)]/20"
          >
            {Object.entries(COUNTRY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="py-3">
          <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Member Since
          </p>
          <p className="text-sm text-[var(--color-text-primary)]">
            {new Date(user.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </SettingsSection>

      <SettingsSection title="Danger Zone">
        <div className="py-4">
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-3">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            className="px-4 py-2.5 text-[13px] font-medium text-[var(--color-danger)] border border-[var(--color-danger)]/30 rounded-xl hover:bg-[var(--color-danger)]/8 active:scale-95 transition-all duration-200"
          >
            Delete Account
          </button>
        </div>
      </SettingsSection>

      <div className="flex flex-col gap-3 pt-2">
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        {successMessage && <p className="text-sm text-[var(--color-success)]">{successMessage}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={isLoading || !isDirty}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition-all duration-200 disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isLoading || !isDirty}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-[#1c2b3a] bg-[var(--color-amber)] rounded-xl hover:brightness-105 transition-all duration-200 disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isLoading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
