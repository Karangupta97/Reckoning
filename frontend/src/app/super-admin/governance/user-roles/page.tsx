"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, UserPlus, CheckCircle2, Mail, MapPin,
  Copy, Check, X, Users, Clock, AlertTriangle,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useAdminUserStore, type AdminUser, type UserStatus } from "@/store/adminUserStore";
import OnboardingRequests from "@/components/super-admin-dashboard/onboarding-requests";

const DISTRICTS = ["Raigad", "Mumbai City", "Pune", "Nagpur", "Thane", "Kolhapur", "Nashik", "Aurangabad"];

const STATUS_CFG: Record<UserStatus, { color: string; bg: string }> = {
  "Pending Onboarding": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  Active: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  Inactive: { color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  Suspended: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  Archived: { color: "#475569", bg: "rgba(71,85,105,0.1)" },
};

export default function UserRolesPage() {
  const users = useAdminUserStore((s) => s.users);
  const createDistrictAdmin = useAdminUserStore((s) => s.createDistrictAdmin);
  const suspendUser = useAdminUserStore((s) => s.suspendUser);
  const activateUser = useAdminUserStore((s) => s.activateUser);

  const [showCreate, setShowCreate] = useState(false);
  const [createdUser, setCreatedUser] = useState<AdminUser | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ email: "", district: "" });
  const [formError, setFormError] = useState("");

  const districtAdmins = users.filter((u) => u.role === "District Admin");
  const subDistrictAdmins = users.filter((u) => u.role === "Sub-District Admin");
  const activeCount = users.filter((u) => u.status === "Active").length;
  const pendingCount = users.filter((u) => u.status === "Pending Onboarding").length;
  const suspendedCount = users.filter((u) => u.status === "Suspended").length;

  const handleCreate = () => {
    if (!form.email || !form.district) { setFormError("All fields are required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError("Invalid email"); return; }
    setFormError("");
    const user = createDistrictAdmin({ email: form.email, designation: "District Infrastructure Commissioner", district: form.district, department: "Road Safety & Infrastructure" });
    setCreatedUser(user);
    setShowCreate(false);
    setForm({ email: "", district: "" });
  };

  const handleCopy = () => {
    if (!createdUser) return;
    navigator.clipboard.writeText(`User ID: ${createdUser.id}\nEmail: ${createdUser.email}\nRole: ${createdUser.role}\nDistrict: ${createdUser.district}\nTemp Password: ${createdUser.tempPassword}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">User Roles & Governance</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Manage admin hierarchy and onboarding</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-semibold"
          style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
          <UserPlus size={13} /> Create District Admin
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Users", value: String(users.length), color: "#8b5cf6", icon: Users },
          { label: "Active", value: String(activeCount), color: "#22c55e", icon: CheckCircle2 },
          { label: "Pending Onboarding", value: String(pendingCount), color: "#f59e0b", icon: Clock },
          { label: "Suspended", value: String(suspendedCount), color: "#ef4444", icon: AlertTriangle },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}25`, color: s.color }}>
              <s.icon size={16} />
            </div>
            <div>
              <div className="text-lg font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{s.label}</div>
            </div>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Success Banner */}
      <AnimatePresence>
        {createdUser && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <DashboardCard className="p-4 flex items-center justify-between"
              style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.04)" }}>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-teal-400" />
                <div>
                  <p className="text-xs font-bold text-teal-400">District Admin Created</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">{createdUser.id} — {createdUser.email} — Temp: {createdUser.tempPassword}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="text-[10px] font-medium text-teal-400 flex items-center gap-1">
                  {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
                <button onClick={() => setCreatedUser(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><X size={14} /></button>
              </div>
            </DashboardCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Directory Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">User Directory</h3>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead><tr>{["ID", "Email", "Role", "District", "Sub-District", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="dashboard-table-th">{h}</th>
              ))}</tr></thead>
              <tbody>
                {users.map((u) => {
                  const sc = STATUS_CFG[u.status];
                  return (
                    <tr key={u.id} className="dashboard-table-row">
                      <td className="dashboard-table-td font-mono text-xs font-bold text-purple-400">{u.id}</td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)]">{u.email}</td>
                      <td className="dashboard-table-td text-[10px] font-medium text-[var(--color-text-primary)]">{u.role}</td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-muted)]">{u.district}</td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-muted)]">{u.subDistrict ?? "—"}</td>
                      <td className="dashboard-table-td">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                          style={{ color: sc.color, background: sc.bg, borderColor: `${sc.color}30` }}>{u.status}</span>
                      </td>
                      <td className="dashboard-table-td text-[10px] text-[var(--color-text-muted)]">{u.createdDate}</td>
                      <td className="dashboard-table-td">
                        <div className="flex items-center gap-1">
                          {u.status === "Active" && (
                            <button onClick={() => suspendUser(u.id, "Super Admin")}
                              className="text-[9px] font-medium text-red-400 hover:underline">Suspend</button>
                          )}
                          {u.status === "Suspended" && (
                            <button onClick={() => activateUser(u.id, "Super Admin")}
                              className="text-[9px] font-medium text-green-400 hover:underline">Activate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Governance Hierarchy */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="p-5">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Governance Hierarchy</h3>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.06)" }}>
              <span className="text-xs font-bold text-cyan-400">Infrastructure Governance Authority</span>
              <span className="text-[9px] text-[var(--color-text-muted)] ml-2">(1 active)</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">↓</span>
            <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.06)" }}>
              <span className="text-xs font-bold text-teal-400">District Infrastructure Commissioners</span>
              <span className="text-[9px] text-[var(--color-text-muted)] ml-2">({districtAdmins.filter((u) => u.status === "Active").length} active)</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">↓</span>
            <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}>
              <span className="text-xs font-bold text-amber-400">Sub-District Infrastructure Officers</span>
              <span className="text-[9px] text-[var(--color-text-muted)] ml-2">({subDistrictAdmins.filter((u) => u.status === "Active").length} active)</span>
            </div>
          </div>
        </DashboardCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <OnboardingRequests />
      </motion.div>

      {/* Create District Admin Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border shadow-xl flex flex-col"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)", maxHeight: "90vh" }}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                <div className="flex items-center gap-2">
                  <UserPlus size={16} className="text-teal-400" />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Create District Admin</h3>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><X size={15} /></button>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {formError && <p className="text-[10px] text-red-400 font-medium">{formError}</p>}
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1 mb-1"><Mail size={11} /> Official Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="district.name@gov.in" className="w-full h-9 rounded-lg border px-3 text-xs outline-none"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1 mb-1"><MapPin size={11} /> District</label>
                  <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full h-9 rounded-lg border px-3 text-xs outline-none appearance-none"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                    <option value="">Select…</option>
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {/* Account preview — metadata strip */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Account Preview</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Title</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">District Infrastructure Commissioner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Role</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">District Admin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Department</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">Road Safety & Infrastructure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] w-20 shrink-0">Status</span>
                    <span className="text-[9px] font-semibold" style={{ color: "#f59e0b" }}>Pending Onboarding</span>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
                <button onClick={() => setShowCreate(false)}
                  className="h-9 px-4 rounded-lg border text-xs font-medium text-[var(--color-text-secondary)]"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>Cancel</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreate}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-semibold"
                  style={{ borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
                  <UserPlus size={12} /> Create District Admin
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
