"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileWarning, Eye, UserCheck, CheckCircle2,
  X, ChevronDown, Check,
} from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useComplaintStore, type ComplaintRecord } from "@/store/complaintStore";

const OFFICERS = ["R. Sharma", "P. Nair", "A. Kulkarni", "M. Patil", "S. Desai"];

const TABS = ["All", "Open", "Assigned", "Resolved", "Rejected"] as const;
type Tab  = typeof TABS[number];

const PRIORITY_CLS: Record<string, string> = {
  Critical: "dashboard-table-badge-status-open",
  High:     "dashboard-table-badge-status-escalated",
  Medium:   "dashboard-table-badge-status-review",
  Low:      "dashboard-table-badge-status-resolved",
};
const STATUS_CLS: Record<string, string> = {
  Open:           "dashboard-table-badge-status-open",
  Assigned:       "dashboard-table-badge-status-escalated",
  "In Progress":  "dashboard-table-badge-status-review",
  Resolved:       "dashboard-table-badge-status-resolved",
  Rejected:       "dashboard-table-badge-priority-high",
};

/* ─── Breadcrumb ─────────────────────────────────────────────── */
function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] mb-1" aria-label="Breadcrumb">
      <Link href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</Link>
      <span className="opacity-40">›</span>
      <span className="text-[var(--color-text-secondary)] font-medium">Complaints</span>
    </nav>
  );
}

/* ─── Assign Officer Modal ───────────────────────────────────── */
function AssignModal({
  complaint,
  onClose,
  onAssign,
}: {
  complaint: ComplaintRecord;
  onClose: () => void;
  onAssign: (id: string, officer: string) => void;
}) {
  const [selected, setSelected] = useState(complaint.officer || "");
  const [success,  setSuccess]  = useState(false);

  const handleAssign = () => {
    if (!selected) return;
    onAssign(complaint.id, selected);
    setSuccess(true);
    setTimeout(onClose, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-sm rounded-2xl border shadow-xl"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assign Complaint</h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 font-mono">{complaint.id}</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{complaint.category} — {complaint.location}</p>
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1.5">Select Officer</label>
            <div className="flex flex-col gap-1.5">
              {OFFICERS.map((o) => (
                <button
                  key={o} type="button"
                  onClick={() => setSelected(o)}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition-all"
                  style={{
                    borderColor: selected === o ? "var(--sda-border-amber)" : "var(--color-border)",
                    background:  selected === o ? "color-mix(in srgb, var(--sda-amber) 8%, transparent)" : "var(--color-surface)",
                    color:       selected === o ? "var(--sda-amber)" : "var(--color-text-secondary)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold"
                      style={{
                        borderColor: selected === o ? "var(--sda-border-amber)" : "var(--color-border)",
                        background:  selected === o ? "color-mix(in srgb, var(--sda-amber) 12%, transparent)" : "var(--color-card)",
                        color:       selected === o ? "var(--sda-amber)" : "var(--color-text-muted)",
                      }}>
                      {o.charAt(0)}
                    </div>
                    <span className="font-medium">{o}</span>
                  </div>
                  {selected === o && <Check size={14} className="text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
          <button onClick={onClose}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleAssign}
            disabled={!selected || success}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              borderColor: success ? "rgba(34,197,94,0.4)" : "var(--sda-border-amber)",
              background:  success ? "rgba(34,197,94,0.1)" : "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
              color:       success ? "var(--color-success)"  : "var(--sda-amber)",
            }}>
            {success ? <><Check size={14} /> Assigned!</> : <><UserCheck size={14} /> Assign</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      onAnimationComplete={() => setTimeout(onDone, 2000)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
      style={{ background: "var(--color-card)", borderColor: "rgba(34,197,94,0.35)", color: "var(--color-success)" }}
    >
      <Check size={15} />
      {message}
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ComplaintsPage() {
  const complaints = useComplaintStore((s) => s.complaints);
  const assignOfficer = useComplaintStore((s) => s.assignOfficer);
  const [activeTab,    setActiveTab]    = useState<Tab>("All");
  const [search,       setSearch]       = useState("");
  const [priorityF,    setPriorityF]    = useState("");
  const [assignTarget, setAssignTarget] = useState<ComplaintRecord | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);

  const filtered = useMemo(() => complaints.filter((c) => {
    if (activeTab !== "All" && c.status !== activeTab) return false;
    if (priorityF && c.priority !== priorityF) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.id.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    }
    return true;
  }), [complaints, activeTab, search, priorityF]);

  const handleAssign = (id: string, officer: string) => {
    assignOfficer(id, officer);
    setAssignTarget(null);
    setToast(`${id} assigned to ${officer}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <Breadcrumb />

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Complaints</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage and resolve citizen complaints for Panvel Taluka</p>
      </motion.div>

      <DashboardCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col">
        {/* Tabs */}
        <div className="flex gap-0 border-b border-[var(--color-border)] overflow-x-auto [scrollbar-width:none] px-4 pt-3">
          {TABS.map((t) => {
            const count = t === "All" ? complaints.length : complaints.filter((c) => c.status === t).length;
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t ? "border-amber-500 text-amber-400" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}>
                {t}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === t ? "bg-amber-500/20 text-amber-400" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 min-w-[180px] max-w-xs transition-colors focus-within:border-amber-500/40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, category…"
              className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full" />
          </div>
          <div className="relative">
            <select value={priorityF} onChange={(e) => setPriorityF(e.target.value)}
              className="h-9 appearance-none rounded-lg border pl-3 pr-7 text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-amber-500/40">
              <option value="">All Priorities</option>
              {["Critical","High","Medium","Low"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border"
              style={{ borderColor: "var(--sda-border-amber)", background: "var(--sda-amber-glow)" }}>
              <FileWarning size={24} style={{ color: "var(--sda-amber)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">No complaints found</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Adjust filters or search query</p>
            </div>
          </motion.div>
        ) : (
          <div className="dashboard-table-scroll flex-1">
            <table className="dashboard-table">
              <thead>
                <tr>{["ID","Category","Priority","Location","Officer","Date","Status","Actions"].map((h) => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((c, i) => (
                    <motion.tr key={c.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="dashboard-table-row sda-table-row">
                      <td className="dashboard-table-td dashboard-table-td-primary font-mono text-xs">{c.id}</td>
                      <td className="dashboard-table-td text-xs">{c.category}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge ${PRIORITY_CLS[c.priority] ?? ""}`}>{c.priority}</span>
                      </td>
                      <td className="dashboard-table-td text-xs max-w-[140px] truncate">{c.location}</td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap">
                        {c.officer || <span className="text-[var(--color-text-muted)] italic">Unassigned</span>}
                      </td>
                      <td className="dashboard-table-td text-xs font-mono whitespace-nowrap">{c.date}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge ${STATUS_CLS[c.status] ?? ""}`}>{c.status}</span>
                      </td>
                      <td className="dashboard-table-td">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <Link href={`/sub-district-admin/dashboard/complaints/${c.id}`}>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-medium transition-colors"
                              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }}
                              title="View">
                              <Eye size={11} /> View
                            </motion.button>
                          </Link>
                          {/* Assign */}
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setAssignTarget(c)}
                            className="flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-medium transition-colors"
                            style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "var(--color-info)" }}
                            title="Assign Officer">
                            <UserCheck size={11} /> Assign
                          </motion.button>
                          {/* Resolve */}
                          <Link href={`/sub-district-admin/dashboard/complaints/${c.id}/resolve`}>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-medium transition-colors"
                              style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "var(--color-success)" }}
                              title="Resolve">
                              <CheckCircle2 size={11} /> Resolve
                            </motion.button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-border)]">
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {filtered.length} of {complaints.length} complaints
          </span>
        </div>
      </DashboardCard>

      {/* Assign modal */}
      <AnimatePresence>
        {assignTarget && (
          <AssignModal
            complaint={assignTarget}
            onClose={() => setAssignTarget(null)}
            onAssign={handleAssign}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
