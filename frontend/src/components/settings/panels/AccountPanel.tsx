"use client";

import { Camera } from "lucide-react";
import { SettingsSection } from "../SettingsSection";
import { SettingsInput } from "../SettingsInput";
import { useSettingsStore } from "../../../store/settingsStore";

export function AccountPanel() {
  const {
    fullName, email, phone, emergencyContact,
    address, district, subDistrict, state, country,
    setField,
  } = useSettingsStore();

  return (
    <div>
      {/* Profile Photo */}
      <SettingsSection title="Profile Photo">
        <div className="py-4 flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-amber)] to-orange-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
              KS
            </div>
            <button
              className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100
                flex items-center justify-center transition-opacity duration-200"
              aria-label="Change profile photo"
            >
              <Camera size={18} className="text-white" />
            </button>
          </div>
          <div>
            <button className="px-3.5 py-2 text-xs font-medium text-[var(--color-amber)]
              border border-[var(--color-amber)]/30 rounded-lg
              hover:bg-[var(--color-amber)]/5 active:scale-95
              transition-all duration-200">
              Upload Photo
            </button>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
              JPG, PNG or WebP. Max 5MB.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Personal Information */}
      <SettingsSection title="Personal Information" description="Your basic profile details.">
        <SettingsInput
          label="Full Name"
          value={fullName}
          onChange={(v) => setField("fullName", v)}
          placeholder="Enter your full name"
        />
        <SettingsInput
          label="Email Address"
          value={email}
          onChange={(v) => setField("email", v)}
          type="email"
          placeholder="your@email.com"
        />
        <SettingsInput
          label="Phone Number"
          value={phone}
          onChange={(v) => setField("phone", v)}
          type="tel"
          placeholder="+91 XXXXX XXXXX"
        />
        <SettingsInput
          label="Emergency Contact"
          value={emergencyContact}
          onChange={(v) => setField("emergencyContact", v)}
          type="tel"
          placeholder="+91 XXXXX XXXXX"
        />
      </SettingsSection>

      {/* Address */}
      <SettingsSection title="Address" description="Used for localized hazard reports.">
        <SettingsInput
          label="Street Address"
          value={address}
          onChange={(v) => setField("address", v)}
          placeholder="Street address"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <SettingsInput
            label="Sub-District"
            value={subDistrict}
            onChange={(v) => setField("subDistrict", v)}
            placeholder="Sub-district"
          />
          <SettingsInput
            label="District"
            value={district}
            onChange={(v) => setField("district", v)}
            placeholder="District"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <SettingsInput
            label="State"
            value={state}
            onChange={(v) => setField("state", v)}
            placeholder="State"
          />
          <SettingsInput
            label="Country"
            value={country}
            onChange={(v) => setField("country", v)}
            placeholder="Country"
          />
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Danger Zone">
        <div className="py-4">
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-3">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            className="px-4 py-2.5 text-[13px] font-medium text-[var(--color-danger)]
              border border-[var(--color-danger)]/30 rounded-xl
              hover:bg-[var(--color-danger)]/8 active:scale-95
              transition-all duration-200"
          >
            Delete Account
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
