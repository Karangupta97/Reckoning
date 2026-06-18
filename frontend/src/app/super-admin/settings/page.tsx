"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Shield, Bell, Sliders, HelpCircle, Save, CheckCircle2, Eye, EyeOff, Check } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useThemeStore } from "@/stores/theme-store";
import { Sun, Moon, Monitor } from "lucide-react";
import { DemoResetButton } from "@/components/admin/DemoResetButton";

type TabId = "profile" | "security" | "notifications" | "system" | "help";

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "profile",       label: "Profile",        icon: User      },
  { id: "security",      label: "Security",       icon: Shield    },
  { id: "notifications", label: "Notifications",  icon: Bell      },
  { id: "system",        label: "System",         icon: Sliders   },
  { id: "help",          label: "Help",           icon: HelpCircle},
];

function SaveButton({ saved, onClick, disabled }: { saved: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick} disabled={disabled || saved}
      className="btn-primary flex items-center gap-2 mt-4 disabled:opacity-50">
      {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
      {saved ? "Saved!" : "Save Changes"}
    </motion.button>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const validTabs = TABS.map(t => t.id);
  const [activeTab, setActiveTab] = useState<TabId>(tabParam && validTabs.includes(tabParam) ? tabParam : "profile");
  const [saved, setSaved] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { mode, setMode } = useThemeStore();

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const inputCls = "h-10 rounded-lg border px-3 text-sm outline-none focus:border-cyan-500/40 transition-colors w-full";
  const inputStyle = { borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" };

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Settings size={20} className="text-cyan-400 shrink-0" />
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Settings</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DashboardCard className="p-1 flex flex-wrap gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent"
              }`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </DashboardCard>
      </motion.div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>

        {activeTab === "profile" && (
          <DashboardCard className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Super Admin Profile</h2>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold"
                style={{ borderColor: "rgba(34,211,238,0.4)", background: "rgba(34,211,238,0.1)", color: "#22d3ee" }}>S</div>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Super Admin</p>
                <p className="text-xs text-[var(--color-text-muted)]">SA-2026-INFRA</p>
                <button type="button" className="mt-1 text-xs text-cyan-400 hover:text-cyan-300">Change avatar</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Full Name",       value: "Super Administrator"        },
                { label: "Employee ID",     value: "SA-2026-INFRA"              },
                { label: "Official Email",  value: "super@infrastructure.gov.in", type: "email" },
                { label: "Phone",           value: "+91 11 2345 6789",           type: "tel"   },
                { label: "Organisation",    value: "Ministry of Road Transport" },
                { label: "Designation",     value: "National Infrastructure Authority" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{f.label}</label>
                  <input type={f.type || "text"} defaultValue={f.value} className={inputCls} style={inputStyle} />
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
              {["Current Password","New Password","Confirm New Password"].map((label) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} placeholder="••••••••"
                      className="h-10 w-full rounded-lg border px-3 pr-10 text-sm outline-none focus:border-cyan-500/40"
                      style={inputStyle} />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-cyan-400">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Two-Factor Authentication</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Secure your super-admin account with 2FA</p>
                </div>
                <div className="flex h-6 w-11 cursor-pointer rounded-full bg-cyan-500/20 border border-cyan-500/30 p-0.5">
                  <span className="h-5 w-5 translate-x-5 rounded-full bg-cyan-400 transition-transform" />
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
                { label: "AI Anomaly Detected",      desc: "Alert when AI flags a new risk",              on: true  },
                { label: "Budget Overspend Warning",  desc: "Alert on expenditure threshold breach",       on: true  },
                { label: "Contractor Risk Spike",     desc: "Alert when a contractor risk score spikes",   on: true  },
                { label: "Escalation Received",       desc: "Alert on new district-level escalation",     on: false },
                { label: "System Health",             desc: "Platform infrastructure alerts",              on: true  },
                { label: "Weekly Summary",            desc: "National overview digest every Monday",       on: true  },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{n.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{n.desc}</p>
                  </div>
                  <div className={`flex h-6 w-11 cursor-pointer rounded-full border p-0.5 transition-colors ${n.on ? "bg-cyan-500/20 border-cyan-500/30" : "bg-[var(--color-border)] border-[var(--color-border)]"}`}>
                    <span className={`h-5 w-5 rounded-full transition-transform ${n.on ? "translate-x-5 bg-cyan-400" : "bg-[var(--color-text-muted)]"}`} />
                  </div>
                </div>
              ))}
              <SaveButton saved={saved} onClick={handleSave} />
            </div>
          </DashboardCard>
        )}

        {activeTab === "system" && (
          <DashboardCard className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">System Settings</h2>
            <div className="flex flex-col gap-5 max-w-md">
              <div>
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Appearance</p>
                <div className="flex gap-3">
                  {[
                    { value: "light" as const,  label: "Light",  icon: <Sun size={16} />     },
                    { value: "dark"  as const,  label: "Dark",   icon: <Moon size={16} />    },
                    { value: "system" as const, label: "System", icon: <Monitor size={16} /> },
                  ].map((t) => (
                    <button key={t.value} type="button" onClick={() => setMode(t.value)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border px-5 py-3 text-xs font-medium transition-all"
                      style={{
                        borderColor: mode === t.value ? "rgba(34,211,238,0.5)" : "var(--color-border)",
                        background:  mode === t.value ? "rgba(34,211,238,0.08)" : "var(--color-surface)",
                        color:       mode === t.value ? "#22d3ee" : "var(--color-text-secondary)",
                      }}>
                      {t.icon}{t.label}
                      {mode === t.value && <Check size={10} className="text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: "Default Date Range",      options: ["Today","This Week","This Month","This Quarter"] },
                { label: "Table Rows Per Page",     options: ["10","25","50","100"]                            },
                { label: "Map Default Zoom Level",  options: ["National","State","District"]                   },
                { label: "SLA Alert Threshold (h)", options: ["6","12","24","48"]                              },
              ].map((p) => (
                <div key={p.label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">{p.label}</label>
                  <select className={inputCls} style={inputStyle}>
                    {p.options.map(o => <option key={o} style={{ background: "var(--color-card)" }}>{o}</option>)}
                  </select>
                </div>
              ))}
              <SaveButton saved={saved} onClick={handleSave} />
            </div>
          </DashboardCard>
        )}

        {activeTab === "help" && (
          <DashboardCard className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">Help Center</h2>
            <div className="flex flex-col gap-3 max-w-lg">
              {[
                { q: "How do I escalate a complaint to super-admin level?",         a: "From the district escalation detail page, use the 'Escalate Further' button."       },
                { q: "How are AI risk scores calculated?",                           a: "Scores combine budget variance, delay patterns, and quality complaint frequency."    },
                { q: "How do I add a new district admin?",                          a: "Go to Admin Governance → User Roles and use the Manage All onboarding panel."       },
                { q: "What triggers an automatic SLA escalation?",                  a: "Complaints unresolved past their SLA window are auto-escalated by the system."       },
                { q: "How do I download a report?",                                 a: "Go to Reports, find the report and click the Download button on any Ready report."    },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">{item.q}</p>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-300">
                For technical support, contact: <span className="font-mono font-semibold">support@reckoning.gov.in</span>
              </div>
            </div>
          </DashboardCard>
        )}
      </motion.div>

      {/* Demo Reset */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DashboardCard className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Demo & Testing</h3>
          <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Reset All Demo Data</p>
              <p className="text-xs text-[var(--color-text-muted)]">Clear all stores and reload with fresh seed data for demo replay</p>
            </div>
            <DemoResetButton />
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-cyan-400" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
