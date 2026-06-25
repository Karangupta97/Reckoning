"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  UserCircle, Shield, Bell, Settings, CheckCircle2,
  Eye, EyeOff, Save, Sun, Moon, Monitor, Check,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useDistrictInfo } from "@/hooks/useDistrictInfo";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

type TabId = "profile" | "security" | "notifications" | "preferences";

const TABS: { id: TabId; label: string; icon: typeof UserCircle }[] = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Settings },
];

function ThemePreferences() {
  const { mode, setMode } = useThemeStore();
  const options = [
    { value: "light"  as const, label: "Light",  icon: <Sun  size={16} /> },
    { value: "dark"   as const, label: "Dark",   icon: <Moon size={16} /> },
    { value: "system" as const, label: "System", icon: <Monitor size={16} /> },
  ];
  return (
    <div className="max-w-md">
      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Appearance</p>
      <p className="text-[10px] text-[var(--color-text-muted)] mb-3">Synced with the header toggle — updates the whole app instantly.</p>
      <div className="flex gap-3">
        {options.map((t) => (
          <button key={t.value} type="button" onClick={() => setMode(t.value)}
            className="flex flex-col items-center gap-1.5 rounded-xl border px-5 py-3 text-xs font-medium transition-all"
            style={{
              borderColor: mode === t.value ? "var(--da-border-teal)" : "var(--color-border)",
              background:  mode === t.value ? "color-mix(in srgb, var(--da-teal) 8%, var(--color-surface))" : "var(--color-surface)",
              color:       mode === t.value ? "var(--da-teal)" : "var(--color-text-secondary)",
            }}>
            <span style={{ color: mode === t.value ? "var(--da-teal)" : "var(--color-text-muted)" }}>{t.icon}</span>
            {t.label}
            {mode === t.value && <Check size={10} className="text-teal-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const validTabs = TABS.map((t) => t.id);
  const initialTab: TabId = tabParam && validTabs.includes(tabParam) ? tabParam : "profile";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [saved, setSaved] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { districtName } = useDistrictInfo();
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const adminEmail = currentAdmin?.email ?? "admin@district.gov.in";

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <UserCircle size={20} className="text-teal-400 shrink-0" />
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
          District Infrastructure Commissioner
        </h1>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <DashboardCard className="p-1 flex flex-wrap gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-teal-500/10 text-teal-300 border border-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.1)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </DashboardCard>
      </motion.div>

      {/* Tab panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === "profile" && (
          <DashboardCard className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Personal Information</h2>

            {/* Avatar row */}
            <div className="mb-5 flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold"
                style={{
                  borderColor: "var(--da-border-teal)",
                  background: "color-mix(in srgb, var(--da-teal) 12%, transparent)",
                  color: "var(--da-teal)",
                }}
              >
                D
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">District Infrastructure Commissioner</p>
                <p className="text-xs text-[var(--color-text-muted)]">DA-2026-DCO</p>
                <button type="button" className="mt-1 text-xs text-teal-400 hover:text-teal-300">
                  Change avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Full Name", placeholder: "District Infrastructure Commissioner", value: "District Infrastructure Commissioner" },
                { label: "Employee ID", placeholder: "DA-2026-DCO", value: "DA-2026-DCO" },
                { label: "Official Email", placeholder: adminEmail, value: adminEmail, type: "email" },
                { label: "Phone", placeholder: "+91 98765 00000", value: "+91 98765 00000", type: "tel" },
                { label: "District", placeholder: `${districtName} District`, value: `${districtName} District` },
                { label: "Designation", placeholder: "District Infrastructure Commissioner", value: "District Infrastructure Commissioner" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    readOnly
                    value={f.value}
                    className="h-10 rounded-lg border px-3 text-sm outline-none focus:border-teal-500/40 transition-colors"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              ))}
            </div>
            <SaveButton saved={saved} onClick={handleSave} />
          </DashboardCard>
        )}

        {activeTab === "security" && (
          <DashboardCard className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Security Settings</h2>
            <div className="flex flex-col gap-4 max-w-md">
              {[
                { label: "Current Password", placeholder: "••••••••" },
                { label: "New Password", placeholder: "••••••••" },
                { label: "Confirm New Password", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{f.label}</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder={f.placeholder}
                      className="h-10 w-full rounded-lg border px-3 pr-10 text-sm outline-none focus:border-teal-500/40"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-surface)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-teal-400"
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* 2FA toggle */}
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Two-Factor Authentication</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Secure your account with 2FA</p>
                </div>
                <div className="flex h-6 w-11 cursor-pointer rounded-full bg-teal-500/20 border border-teal-500/30 p-0.5">
                  <span className="h-5 w-5 translate-x-5 rounded-full bg-teal-400 transition-transform" />
                </div>
              </div>

              <SaveButton saved={saved} onClick={handleSave} />
            </div>
          </DashboardCard>
        )}

        {activeTab === "notifications" && (
          <DashboardCard className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Notification Preferences</h2>
            <div className="flex flex-col gap-3 max-w-lg">
              {[
                { label: "New Escalation Raised", desc: "Alert when a new escalation is submitted", enabled: true },
                { label: "SLA Breach Warning", desc: "Alert when a complaint is nearing SLA deadline", enabled: true },
                { label: "Complaint Resolved", desc: "Notify when a complaint is marked resolved", enabled: false },
                { label: "Officer Activity", desc: "Updates from sub-district officers", enabled: true },
                { label: "Weekly Digest", desc: "Weekly district performance summary email", enabled: true },
                { label: "System Alerts", desc: "Platform maintenance and security notifications", enabled: false },
              ].map((n, i) => (
                <div
                  key={n.label}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{n.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{n.desc}</p>
                  </div>
                  <div
                    className={`flex h-6 w-11 cursor-pointer rounded-full border p-0.5 transition-colors ${
                      n.enabled
                        ? "bg-teal-500/20 border-teal-500/30"
                        : "bg-[var(--color-border)] border-[var(--color-border)]"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full transition-transform ${
                        n.enabled ? "translate-x-5 bg-teal-400" : "translate-x-0 bg-[var(--color-text-muted)]"
                      }`}
                    />
                  </div>
                </div>
              ))}
              <SaveButton saved={saved} onClick={handleSave} />
            </div>
          </DashboardCard>
        )}

        {activeTab === "preferences" && (
          <DashboardCard className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Dashboard Preferences</h2>
            <ThemePreferences />
            <div className="mt-6 border-t border-[var(--color-border)] pt-4 flex flex-col gap-4 max-w-md">
              {[
                { label: "Default Date Range", options: ["Today", "This Week", "This Month", "This Quarter"] },
                { label: "Map Default View", options: ["Risk View", "Report Density", "Resolution Rate"] },
                { label: "Table Rows Per Page", options: ["10", "25", "50", "100"] },
              ].map((pref) => (
                <div key={pref.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{pref.label}</label>
                  <select
                    className="h-10 rounded-lg border px-3 text-sm outline-none"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {pref.options.map((o) => (
                      <option key={o} style={{ background: "var(--color-card)" }}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}
              <SaveButton saved={saved} onClick={handleSave} />
            </div>
          </DashboardCard>
        )}
      </motion.div>
    </div>
  );
}

function SaveButton({
  saved,
  onClick,
}: {
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="da-btn-primary flex items-center gap-2"
      >
        {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {saved ? "Saved!" : "Save Changes"}
      </motion.button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-teal-400" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
