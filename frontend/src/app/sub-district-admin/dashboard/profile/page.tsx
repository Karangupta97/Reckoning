"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Shield, Bell, Settings, Save, Eye, EyeOff,
  Check, Monitor, Globe, Clock, LogOut, CheckCircle2,
  Sun, Moon, MapPin, Activity, FileWarning, Ticket,
  Upload, AlertTriangle, Calendar, Key, Smartphone,
  Users, TrendingUp,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { SUB_DISTRICT_CONFIG } from "@/lib/sub-district-config";
import { useThemeStore, type ThemeMode } from "@/stores/theme-store";

/* ─── Tab config ─────────────────────────────────────────────── */
const TABS = [
  { id: "personal",      label: "Personal Info",  icon: User     },
  { id: "security",      label: "Security",       icon: Shield   },
  { id: "notifications", label: "Notifications",  icon: Bell     },
  { id: "preferences",   label: "Preferences",    icon: Settings },
] as const;
type Tab = typeof TABS[number]["id"];

/* ─── Reusable primitives ────────────────────────────────────── */
function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
      <a href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</a>
      <span className="opacity-40">›</span>
      <span className="text-[var(--color-text-secondary)] font-medium">Profile & Settings</span>
    </nav>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex border-b border-[var(--color-border)] overflow-x-auto [scrollbar-width:none]">
      {TABS.map((t) => (
        <button key={t.id} type="button" onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            active === t.id
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}>
          <t.icon size={14} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function InputField({ defaultValue, placeholder, type = "text", readOnly }:
  { defaultValue?: string; placeholder?: string; type?: string; readOnly?: boolean }) {
  return (
    <input type={type} defaultValue={defaultValue} placeholder={placeholder} readOnly={readOnly}
      className={`w-full h-10 rounded-lg border px-3 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] focus:outline-none focus:border-amber-500/40 transition-colors ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
    />
  );
}

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }}
      className="flex items-center gap-2 h-10 px-5 rounded-lg border text-sm font-medium transition-all"
      style={{
        borderColor: saved ? "rgba(34,197,94,0.4)" : "var(--sda-border-amber)",
        background:  saved ? "rgba(34,197,94,0.1)" : "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
        color:       saved ? "var(--color-success)" : "var(--sda-amber)",
      }}>
      <AnimatePresence mode="wait">
        {saved
          ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><CheckCircle2 size={14} /> Saved!</motion.span>
          : <motion.span key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><Save size={14} /> {label}</motion.span>}
      </AnimatePresence>
    </motion.button>
  );
}

function Toggle({ defaultOn = false, onChange }: { defaultOn?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button type="button" role="switch" aria-checked={on}
      onClick={() => { const n = !on; setOn(n); onChange?.(n); }}
      className="relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      style={{
        background: on ? "var(--sda-amber)" : "var(--color-surface)",
        border: `1.5px solid ${on ? "var(--sda-amber)" : "var(--color-border)"}`,
        boxShadow: on ? "0 0 8px color-mix(in srgb, var(--sda-amber) 35%, transparent)" : "none",
      }}>
      <motion.span
        animate={{ x: on ? 19 : 2 }}
        transition={{ type: "spring", damping: 22, stiffness: 340 }}
        className="inline-block h-[16px] w-[16px] rounded-full shadow-sm"
        style={{ background: on ? "#fff" : "color-mix(in srgb, var(--color-text-muted) 55%, var(--color-border))" }}
      />
    </button>
  );
}

/* ─── Personal Info Tab ──────────────────────────────────────── */
function PersonalInfoTab() {
  const recentActivity = [
    { icon: FileWarning, color: "text-amber-400",  text: "Complaint #CMP-1024 assigned",         time: "2h ago" },
    { icon: Ticket,      color: "text-blue-400",   text: "Ticket #TKT-0501 updated",             time: "5h ago" },
    { icon: Upload,      color: "text-purple-400", text: "Evidence uploaded for #CMP-0987",      time: "8h ago" },
    { icon: CheckCircle2,color: "text-green-400",  text: "Complaint #CMP-0924 resolved",         time: "1d ago" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Account status banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: "rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          <span className="text-xs font-semibold text-green-400">Account Active</span>
        </div>
        <div className="h-3 w-px bg-[var(--color-border)] hidden sm:block" />
        <span className="text-xs text-[var(--color-text-muted)]">Role: <span className="font-medium text-[var(--color-text-secondary)]">Sub-District Administrator</span></span>
        <div className="h-3 w-px bg-[var(--color-border)] hidden sm:block" />
        <span className="text-xs text-[var(--color-text-muted)]">Last login: <span className="font-medium text-[var(--color-text-secondary)]">Today, 08:14 AM</span></span>
        <div className="h-3 w-px bg-[var(--color-border)] hidden sm:block" />
        <span className="text-xs text-[var(--color-text-muted)]">Permissions: <span className="font-medium text-amber-400">Field Ops · Resolve · Escalate</span></span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — form */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-xl font-black"
              style={{ borderColor: "var(--sda-border-amber)", background: "var(--sda-amber-glow)", color: "var(--sda-amber)" }}>
              SA
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">Suresh Ambulkar</p>
              <p className="text-xs text-[var(--color-text-muted)]">Sub-District Administrator · Panvel Taluka</p>
              <button className="mt-1 text-xs font-medium hover:underline transition-colors" style={{ color: "var(--sda-amber)" }}>
                Change Photo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="Full Name"><InputField defaultValue="Suresh Ambulkar" /></FieldRow>
            <FieldRow label="Email Address"><InputField defaultValue="suresh.ambulkar@raigad.gov.in" type="email" /></FieldRow>
            <FieldRow label="Phone Number"><InputField defaultValue="+91 97632 11890" type="tel" /></FieldRow>
            <FieldRow label="Designation"><InputField defaultValue="Sub-District Administrator" /></FieldRow>
          </div>

          <div className="flex justify-end pt-1">
            <SaveButton />
          </div>
        </div>

        {/* Right — territory + activity */}
        <div className="flex flex-col gap-4">
          {/* Territory Info */}
          <div className="rounded-xl border p-4 flex flex-col gap-3"
            style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 4%, var(--color-surface))" }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} style={{ color: "var(--sda-amber)" }} />
              <span className="text-xs font-bold text-[var(--color-text-primary)]">Territory Information</span>
            </div>
            {[
              { label: "District",       value: SUB_DISTRICT_CONFIG.district  },
              { label: "Sub-District",   value: SUB_DISTRICT_CONFIG.name      },
              { label: "Zone",           value: SUB_DISTRICT_CONFIG.zone      },
              { label: "Population",     value: "~2.4 Lakh"                   },
              { label: "Active Officers",value: String(SUB_DISTRICT_CONFIG.activeOfficers) },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between py-1 border-b border-[var(--color-border)] last:border-0">
                <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
                <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-[var(--color-text-primary)]">Recent Activity</span>
            </div>
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border mt-0.5"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <a.icon size={11} className={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug">{a.text}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Security Tab ───────────────────────────────────────────── */
function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFa,       setTwoFa]       = useState(true);

  const sessions = [
    { device: "Chrome — Windows 11",  location: "Panvel, Maharashtra",  time: "Now",       current: true  },
    { device: "Firefox — MacOS",       location: "Mumbai, Maharashtra",  time: "2 days ago", current: false },
    { device: "Mobile App — Android",  location: "Panvel, Maharashtra",  time: "5 days ago", current: false },
  ];

  const PwdField = ({ label, show, toggle, placeholder }: { label: string; show: boolean; toggle: () => void; placeholder: string }) => (
    <FieldRow label={label}>
      <div className="relative">
        <input type={show ? "text" : "password"} placeholder={placeholder}
          className="w-full h-10 rounded-lg border px-3 pr-10 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] focus:outline-none focus:border-amber-500/40" />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </FieldRow>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Change Password */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Key size={15} className="text-amber-400" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Change Password</h3>
        </div>
        <div className="flex flex-col gap-3 max-w-md">
          <PwdField label="Current Password"      show={showCurrent} toggle={() => setShowCurrent(p => !p)} placeholder="Enter current password" />
          <PwdField label="New Password"           show={showNew}     toggle={() => setShowNew(p => !p)}     placeholder="Min. 8 characters" />
          <PwdField label="Confirm New Password"   show={showConfirm} toggle={() => setShowConfirm(p => !p)} placeholder="Repeat new password" />
          <SaveButton label="Update Password" />
        </div>
      </div>

      {/* 2FA */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <Smartphone size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Two-Factor Authentication</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Adds an extra layer of security to your account via SMS or authenticator app.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[var(--color-text-muted)]">{twoFa ? "Enabled" : "Disabled"}</span>
            <Toggle defaultOn={twoFa} onChange={setTwoFa} />
          </div>
        </div>
        <AnimatePresence>
          {twoFa && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)" }}>
                <Check size={13} className="text-green-400 shrink-0" />
                <span className="text-xs text-green-400">Active — verification sent to +91 97632 ****90</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Sessions */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-amber-400" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Active Sessions</h3>
        </div>
        <div className="flex flex-col gap-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{
                borderColor: s.current ? "var(--sda-border-amber)" : "var(--color-border)",
                background:  s.current ? "color-mix(in srgb, var(--sda-amber) 5%, var(--color-surface))" : "var(--color-surface)",
              }}>
              <div className="flex items-center gap-3 min-w-0">
                <Monitor size={16} style={{ color: s.current ? "var(--sda-amber)" : "var(--color-text-muted)" }} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] flex flex-wrap items-center gap-1.5">
                    {s.device}
                    {s.current && <span className="text-[10px] font-medium text-green-400">(Current)</span>}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{s.location} · {s.time}</p>
                </div>
              </div>
              {!s.current && (
                <button className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors shrink-0 ml-3">
                  <LogOut size={11} /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications Tab ──────────────────────────────────────── */
function NotificationsTab() {
  const groups = [
    {
      title: "Complaint Alerts",
      items: [
        { label: "New complaint assigned",            defaultOn: true  },
        { label: "SLA breach warning",                defaultOn: true  },
        { label: "Escalation received from district", defaultOn: true  },
        { label: "Complaint status updated",          defaultOn: false },
      ],
    },
    {
      title: "Ticket Updates",
      items: [
        { label: "Ticket created",           defaultOn: true  },
        { label: "Ticket status changed",    defaultOn: true  },
        { label: "Work order completed",     defaultOn: true  },
        { label: "Overdue ticket alert",     defaultOn: true  },
      ],
    },
    {
      title: "System Notifications",
      items: [
        { label: "Daily summary report",     defaultOn: false },
        { label: "Officer activity alerts",  defaultOn: false },
        { label: "System maintenance",       defaultOn: true  },
        { label: "Login from new device",    defaultOn: true  },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">{group.title}</p>
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            {group.items.map((item, i) => (
              <div key={item.label} className={`flex items-center justify-between px-4 py-3 ${i < group.items.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
                <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
                <Toggle defaultOn={item.defaultOn} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <SaveButton label="Save Notification Settings" />
      </div>
    </div>
  );
}

/* ─── Preferences Tab ────────────────────────────────────────── */
function PreferencesTab() {
  const { mode, setMode } = useThemeStore();
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "light",  label: "Light",  icon: <Sun  size={18} />, desc: "Clean white interface" },
    { value: "dark",   label: "Dark",   icon: <Moon size={18} />, desc: "Easy on the eyes"      },
    { value: "system", label: "System", icon: <Monitor size={18} />, desc: "Follows OS setting" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Appearance */}
      <div>
        <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Appearance</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          Synced with the header toggle. Changes apply immediately across the entire app.
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {themeOptions.map((t) => (
            <button key={t.value} type="button" onClick={() => setMode(t.value)}
              className="flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              style={{
                borderColor: mode === t.value ? "var(--sda-border-amber)" : "var(--color-border)",
                background:  mode === t.value ? "color-mix(in srgb, var(--sda-amber) 8%, var(--color-surface))" : "var(--color-surface)",
                color:       mode === t.value ? "var(--sda-amber)" : "var(--color-text-secondary)",
              }}>
              <span style={{ color: mode === t.value ? "var(--sda-amber)" : "var(--color-text-muted)" }}>{t.icon}</span>
              <span className="font-semibold">{t.label}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] text-center leading-tight">{t.desc}</span>
              {mode === t.value && <Check size={11} className="text-amber-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Language & Timezone */}
      <div className="border-t border-[var(--color-border)] pt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md">
        <FieldRow label="Language">
          <div className="relative">
            <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-10 rounded-lg border pl-9 pr-3 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] focus:outline-none focus:border-amber-500/40 appearance-none">
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
        </FieldRow>
        <FieldRow label="Timezone">
          <div className="relative">
            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-10 rounded-lg border pl-9 pr-3 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] focus:outline-none focus:border-amber-500/40 appearance-none">
              <option value="Asia/Kolkata">IST (UTC+5:30)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Dubai">GST (UTC+4)</option>
            </select>
          </div>
        </FieldRow>
      </div>

      {/* Accessibility */}
      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Accessibility</p>
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden max-w-md">
          {[
            { label: "Reduce motion effects",  defaultOn: false },
            { label: "High contrast mode",     defaultOn: false },
            { label: "Compact table view",     defaultOn: false },
          ].map((item, i, arr) => (
            <div key={item.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
              <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
              <Toggle defaultOn={item.defaultOn} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <SaveButton label="Save Preferences" />
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  // Support ?tab=security etc from header Settings menu links
  const tabParam = searchParams.get("tab") as Tab | null;
  const validTabs = TABS.map((t) => t.id);
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : "personal"
  );

  // Sync when searchParam changes (e.g. browser back/forward)
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as Tab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const handleTabChange = useCallback((t: Tab) => {
    setActiveTab(t);
    // Update URL without full navigation so back button works cleanly
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  return (
    <div className="flex flex-col gap-3 pb-6">
      <Breadcrumb />

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Profile & Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage your account, security, notifications, and preferences</p>
      </motion.div>

      <DashboardCard initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col">
        <div className="px-5 pt-4">
          <TabBar active={activeTab} onChange={handleTabChange} />
        </div>
        <div className="p-5 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === "personal" && (
              <motion.div key="personal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <PersonalInfoTab />
              </motion.div>
            )}
            {activeTab === "security" && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <SecurityTab />
              </motion.div>
            )}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <NotificationsTab />
              </motion.div>
            )}
            {activeTab === "preferences" && (
              <motion.div key="preferences" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <PreferencesTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardCard>
    </div>
  );
}
