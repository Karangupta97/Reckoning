"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  Sliders, MapPin, Clock, AlertTriangle, Save,
  CheckCircle2, Globe, Building2, Users, ShieldCheck,
} from "lucide-react";

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="da-btn-primary flex items-center gap-2 mt-4"
    >
      {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
      {saved ? "Saved!" : "Save Changes"}
    </motion.button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      {desc && <p className="text-[10px] text-[var(--color-text-muted)] -mt-0.5">{desc}</p>}
      {children}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange}
      className={`flex h-6 w-11 cursor-pointer rounded-full border p-0.5 transition-colors ${
        enabled ? "bg-teal-500/20 border-teal-500/30" : "bg-[var(--color-border)] border-[var(--color-border)]"
      }`}>
      <span className={`h-5 w-5 rounded-full transition-transform ${
        enabled ? "translate-x-5 bg-teal-400" : "translate-x-0 bg-[var(--color-text-muted)]"
      }`} />
    </div>
  );
}

export default function DistrictSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [autoEscalate, setAutoEscalate]   = useState(true);
  const [publicDashboard, setPublicDashboard] = useState(false);
  const [geoAlerts, setGeoAlerts]         = useState(true);
  const [slaHours, setSlaHours]           = useState("48");
  const [timezone, setTimezone]           = useState("Asia/Kolkata");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = "h-10 rounded-lg border px-3 text-sm outline-none focus:border-teal-500/40 transition-colors w-full";
  const inputStyle = { borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" };

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Sliders size={20} className="text-teal-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">District Settings</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Configure district-wide operational parameters and policies</p>
        </div>
      </motion.div>

      {/* District Identity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DashboardCard className="p-5 flex flex-col gap-5">
          <Section title="District Identity">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="District Name">
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input type="text" defaultValue="Raigad" className={`${inputCls} pl-9`} style={inputStyle} />
                </div>
              </Field>
              <Field label="State">
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input type="text" defaultValue="Maharashtra" className={`${inputCls} pl-9`} style={inputStyle} />
                </div>
              </Field>
              <Field label="District Code">
                <input type="text" defaultValue="MH-RGD-001" className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Headquarters">
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input type="text" defaultValue="Alibag, Maharashtra" className={`${inputCls} pl-9`} style={inputStyle} />
                </div>
              </Field>
            </div>
          </Section>

          <div className="border-t border-[var(--color-border)] pt-4">
            <Section title="Operational Parameters">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Default SLA (hours)" desc="Complaint resolution deadline">
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input type="number" value={slaHours} onChange={(e) => setSlaHours(e.target.value)}
                      className={`${inputCls} pl-9`} style={inputStyle} />
                  </div>
                </Field>
                <Field label="Timezone">
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                    className={inputCls} style={inputStyle}>
                    {["Asia/Kolkata", "Asia/Mumbai", "UTC"].map((tz) => (
                      <option key={tz} value={tz} style={{ background: "var(--color-card)" }}>{tz}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Max Sub-Districts">
                  <input type="number" defaultValue="12" className={inputCls} style={inputStyle} />
                </Field>
                <Field label="Escalation Threshold (days)" desc="Auto-escalate if unresolved after">
                  <div className="relative">
                    <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input type="number" defaultValue="3" className={`${inputCls} pl-9`} style={inputStyle} />
                  </div>
                </Field>
              </div>
            </Section>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <Section title="Automation & Visibility">
              {[
                { label: "Auto-Escalate on SLA Breach", desc: "Automatically escalate complaints when SLA expires", icon: AlertTriangle, state: autoEscalate, toggle: () => setAutoEscalate((p) => !p) },
                { label: "Geo-Boundary Alerts", desc: "Alert when complaints are filed outside sub-district boundaries", icon: MapPin, state: geoAlerts, toggle: () => setGeoAlerts((p) => !p) },
                { label: "Public Dashboard", desc: "Show anonymised district statistics on the public portal", icon: Globe, state: publicDashboard, toggle: () => setPublicDashboard((p) => !p) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon size={15} className="text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                    </div>
                  </div>
                  <Toggle enabled={item.state} onChange={item.toggle} />
                </div>
              ))}
            </Section>
          </div>

          <SaveButton saved={saved} onClick={handleSave} />
        </DashboardCard>
      </motion.div>

      {/* Sub-District Policies */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="p-5 flex flex-col gap-4">
          <Section title="Sub-District Policies">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Active Sub-Districts", value: "6", color: "text-teal-400", icon: Users },
                { label: "Avg SLA Compliance", value: "81%", color: "text-emerald-400", icon: ShieldCheck },
                { label: "Escalation Rate", value: "4.0%", color: "text-amber-400", icon: AlertTriangle },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <s.icon size={16} className={s.color} />
                  <div>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
