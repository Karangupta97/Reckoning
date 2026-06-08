"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Shield, Bell, Monitor, Eye, EyeOff,
  Check, Globe, Clock, Sun, Moon, Key, Smartphone,
  LogOut, CheckCircle2, Save, Users, AlertTriangle,
  HelpCircle, ChevronRight, ExternalLink,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useThemeStore, type ThemeMode } from "@/stores/theme-store";

/* ─── Tab config ──────────────────────────────────────────────── */
const TABS = [
  { id: "general",       label: "General",       icon: Settings  },
  { id: "security",      label: "Security",      icon: Shield    },
  { id: "notifications", label: "Notifications", icon: Bell      },
  { id: "appearance",    label: "Appearance",    icon: Monitor   },
] as const;
type Tab = typeof TABS[number]["id"];

/* ─── Reusable primitives ─────────────────────────────────────── */
function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
      <a href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</a>
      <span className="opacity-40">›</span>
      <span className="text-[var(--color-text-secondary)] font-medium">Settings</span>
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

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      {hint && <p className="text-[10px] text-[var(--color-text-muted)] -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

function InputField({ defaultValue, placeholder, type = "text", readOnly }: {
  defaultValue?: string; placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <input type={type} defaultValue={defaultValue} placeholder={placeholder} readOnly={readOnly}
      className={`w-full h-10 rounded-lg border px-3 text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-amber-500/40 transition-colors ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
    />
  );
}

function SelectField({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 appearance-none rounded-lg border pl-3 pr-8 text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-amber-500/40">
        {options.map((o) => <option key={o.value} value={o.value} style={{ background: "var(--color-card)" }}>{o.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" width="12" height="12" viewBox="0 0 12 12">
        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

function Toggle({ defaultOn = false, onChange }: { defaultOn?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button type="button" role="switch" aria-checked={on}
      onClick={() => { const n = !on; setOn(n); onChange?.(n); }}
      className="relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50"
      style={{
        background: on ? "var(--sda-amber)" : "var(--color-surface)",
        border: `1.5px solid ${on ? "var(--sda-amber)" : "var(--color-border)"}`,
        boxShadow: on ? "0 0 8px color-mix(in srgb, var(--sda-amber) 30%, transparent)" : "none",
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

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }}
      className="flex items-center gap-2 h-10 px-5 rounded-lg border text-sm font-medium transition-all"
      style={{
        borderColor: saved ? "rgba(34,197,94,0.4)" : "var(--sda-border-amber)",
        background: saved ? "rgba(34,197,94,0.1)" : "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
        color: saved ? "var(--color-success)" : "var(--sda-amber)",
      }}>
      <AnimatePresence mode="wait">
        {saved
          ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><CheckCircle2 size={14} /> Saved!</motion.span>
          : <motion.span key="save" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2"><Save size={14} /> {label}</motion.span>}
      </AnimatePresence>
    </motion.button>
  );
}

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
      {desc && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>}
    </div>
  );
}

/* ─── General Tab ─────────────────────────────────────────────── */
function GeneralTab() {
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [rowsPerPage, setRowsPerPage] = useState("25");

  return (
    <div className="flex flex-col gap-8">
      {/* Zone Info */}
      <div>
        <SectionHeader title="Zone Information" desc="Read-only details about your assigned operational zone." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-lg">
          <FieldRow label="Sub-District">
            <InputField defaultValue="Panvel Taluka" readOnly />
          </FieldRow>
          <FieldRow label="District">
            <InputField defaultValue="Raigad" readOnly />
          </FieldRow>
          <FieldRow label="State">
            <InputField defaultValue="Maharashtra" readOnly />
          </FieldRow>
          <FieldRow label="Zone">
            <InputField defaultValue="Zone A" readOnly />
          </FieldRow>
        </div>
      </div>

      {/* Regional Preferences */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <SectionHeader title="Regional Preferences" desc="Configure language, timezone and display format." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
          <FieldRow label="Language">
            <div className="relative">
              <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 appearance-none rounded-lg border pl-9 pr-8 text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-amber-500/40">
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
                className="w-full h-10 appearance-none rounded-lg border pl-9 pr-8 text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-amber-500/40">
                <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </FieldRow>
          <FieldRow label="Date Format">
            <SelectField value={dateFormat} onChange={setDateFormat} options={[
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ]} />
          </FieldRow>
          <FieldRow label="Rows Per Page">
            <SelectField value={rowsPerPage} onChange={setRowsPerPage} options={[
              { value: "10", label: "10 rows" },
              { value: "25", label: "25 rows" },
              { value: "50", label: "50 rows" },
            ]} />
          </FieldRow>
        </div>
      </div>

      {/* Accessibility */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <SectionHeader title="Accessibility" />
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden max-w-lg">
          {[
            { label: "Reduce motion effects",  hint: "Disables animations across the portal", defaultOn: false },
            { label: "High contrast mode",      hint: "Increases text and border contrast",    defaultOn: false },
            { label: "Compact table view",      hint: "Reduces row height in all tables",      defaultOn: false },
          ].map((item, i, arr) => (
            <div key={item.label} className={`flex items-start justify-between gap-4 px-4 py-3 ${i < arr.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-text-secondary)]">{item.label}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{item.hint}</p>
              </div>
              <Toggle defaultOn={item.defaultOn} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </div>
  );
}

/* ─── Security Tab ────────────────────────────────────────────── */
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

  const PwdField = ({ label, show, onToggle, placeholder }: { label: string; show: boolean; onToggle: () => void; placeholder: string }) => (
    <FieldRow label={label}>
      <div className="relative">
        <input type={show ? "text" : "password"} placeholder={placeholder}
          className="w-full h-10 rounded-lg border px-3 pr-10 text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-amber-500/40" />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </FieldRow>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Password */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Key size={14} className="text-amber-400" />
          <SectionHeader title="Change Password" />
        </div>
        <div className="flex flex-col gap-3 max-w-md">
          <PwdField label="Current Password" show={showCurrent} onToggle={() => setShowCurrent(p => !p)} placeholder="Enter current password" />
          <PwdField label="New Password"      show={showNew}     onToggle={() => setShowNew(p => !p)}     placeholder="Min. 8 characters" />
          <PwdField label="Confirm Password"  show={showConfirm} onToggle={() => setShowConfirm(p => !p)} placeholder="Repeat new password" />
          <SaveButton label="Update Password" />
        </div>
      </div>

      {/* 2FA */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="flex items-start justify-between gap-4 max-w-lg">
          <div className="flex items-start gap-2">
            <Smartphone size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Two-Factor Authentication</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Adds SMS verification to every login.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[var(--color-text-muted)]">{twoFa ? "On" : "Off"}</span>
            <Toggle defaultOn={twoFa} onChange={setTwoFa} />
          </div>
        </div>
        <AnimatePresence>
          {twoFa && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 max-w-lg flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)" }}>
                <Check size={13} className="text-green-400 shrink-0" />
                <span className="text-xs text-green-400">Active — code sent to +91 97632 ****90</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sessions */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={14} className="text-amber-400" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Active Sessions</h3>
        </div>
        <div className="flex flex-col gap-2 max-w-lg">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{
                borderColor: s.current ? "var(--sda-border-amber)" : "var(--color-border)",
                background: s.current ? "color-mix(in srgb, var(--sda-amber) 5%, var(--color-surface))" : "var(--color-surface)",
              }}>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
                  {s.device}
                  {s.current && <span className="text-[10px] text-green-400">(Current)</span>}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{s.location} · {s.time}</p>
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

/* ─── Notifications Tab ───────────────────────────────────────── */
function NotificationsTab() {
  const groups = [
    {
      title: "Complaint Alerts",
      items: [
        { label: "New complaint assigned",              defaultOn: true  },
        { label: "SLA breach warning",                  defaultOn: true  },
        { label: "Escalation received from district",   defaultOn: true  },
        { label: "Complaint status updated",            defaultOn: false },
      ],
    },
    {
      title: "Ticket Updates",
      items: [
        { label: "Ticket created",                      defaultOn: true  },
        { label: "Ticket status changed",               defaultOn: true  },
        { label: "Work order completed",                defaultOn: true  },
        { label: "Overdue ticket alert",                defaultOn: true  },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Daily summary report",                defaultOn: false },
        { label: "Officer activity alerts",             defaultOn: false },
        { label: "System maintenance notices",          defaultOn: true  },
        { label: "Login from new device",               defaultOn: true  },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">{group.title}</p>
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden max-w-lg">
            {group.items.map((item, i, arr) => (
              <div key={item.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
                <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
                <Toggle defaultOn={item.defaultOn} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end max-w-lg">
        <SaveButton label="Save Notification Settings" />
      </div>
    </div>
  );
}

/* ─── Appearance Tab ──────────────────────────────────────────── */
function AppearanceTab() {
  const { mode, setMode } = useThemeStore();

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "light",  label: "Light",  icon: <Sun  size={18} />, desc: "Clean white interface"  },
    { value: "dark",   label: "Dark",   icon: <Moon size={18} />, desc: "Easy on the eyes"       },
    { value: "system", label: "System", icon: <Monitor size={18} />, desc: "Follows OS setting" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Theme */}
      <div>
        <SectionHeader
          title="Appearance"
          desc="Changing here updates the header toggle too — both are the same setting."
        />
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {themeOptions.map((t) => (
            <button key={t.value} type="button" onClick={() => setMode(t.value)}
              className="flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber-500/50"
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

      {/* Dashboard layout */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <SectionHeader title="Dashboard Display" desc="Customize what you see on the main dashboard." />
        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden max-w-lg">
          {[
            { label: "Show Zone Health Score",    defaultOn: true  },
            { label: "Show Activity Feed",         defaultOn: true  },
            { label: "Show Officer Workload",      defaultOn: true  },
            { label: "Show Complaint Heatmap",     defaultOn: true  },
            { label: "Show Resolution Trends",     defaultOn: true  },
            { label: "Auto-refresh data (30s)",    defaultOn: false },
          ].map((item, i, arr) => (
            <div key={item.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
              <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
              <Toggle defaultOn={item.defaultOn} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end max-w-lg">
        <SaveButton label="Save Appearance" />
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const tabParam      = searchParams.get("tab") as Tab | null;
  const validTabs     = TABS.map((t) => t.id);
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : "general"
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as Tab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const handleTabChange = useCallback((t: Tab) => {
    setActiveTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  return (
    <div className="flex flex-col gap-3 pb-6">
      <Breadcrumb />

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-0.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
            <Settings size={16} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] ml-12">Configure portal behaviour, security and appearance</p>
      </motion.div>

      <DashboardCard
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-col"
      >
        <div className="px-5 pt-4">
          <TabBar active={activeTab} onChange={handleTabChange} />
        </div>
        <div className="p-5 min-h-[380px]">
          <AnimatePresence mode="wait">
            {activeTab === "general" && (
              <motion.div key="general" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <GeneralTab />
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
            {activeTab === "appearance" && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <AppearanceTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardCard>

      {/* Help & Support footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: HelpCircle, label: "Help Center",     desc: "Guides and documentation",     href: "#" },
          { icon: AlertTriangle, label: "Report Issue", desc: "Submit a bug or feedback",      href: "#" },
          { icon: ExternalLink,  label: "Release Notes",desc: "What's new in this version",    href: "#" },
        ].map(({ icon: Icon, label, desc, href }) => (
          <a key={label} href={href}
            className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:border-amber-500/20 hover:bg-[var(--color-surface)] group"
            style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <Icon size={15} className="text-[var(--color-text-muted)] group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">{label}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">{desc}</p>
            </div>
            <ChevronRight size={14} className="text-[var(--color-text-muted)] ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </motion.div>
    </div>
  );
}
