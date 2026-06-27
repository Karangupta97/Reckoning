"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileWarning, Eye, CheckCircle2,
  X, ChevronDown, Loader2, RefreshCw, AlertTriangle,
  Clock, ChevronRight, MapPin, ShieldAlert, TrendingUp,
  Filter, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  useSubDistrictComplaintStore,
  type ApiComplaint,
  type ApiComplaintStatus,
} from "@/store/subDistrictComplaintStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: { label: string; value: ApiComplaintStatus | "ALL" }[] = [
  { label: "All",         value: "ALL"         },
  { label: "Submitted",   value: "SUBMITTED"   },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved",    value: "RESOLVED"    },
  { label: "Escalated",   value: "ESCALATED"   },
  { label: "Rejected",    value: "REJECTED"    },
];

const STATUS_STYLE: Record<ApiComplaintStatus, { cls: string; label: string; color: string }> = {
  DRAFT:                  { cls: "dashboard-table-badge-status-review",    label: "Draft",                  color: "#94a3b8" },
  SUBMITTED:              { cls: "dashboard-table-badge-status-open",      label: "Submitted",              color: "#ef4444" },
  UNDER_REVIEW:           { cls: "dashboard-table-badge-status-review",    label: "Under Review",           color: "#a78bfa" },
  VERIFIED:               { cls: "dashboard-table-badge-status-review",    label: "Verified",               color: "#60a5fa" },
  ASSIGNED:               { cls: "dashboard-table-badge-status-escalated", label: "Assigned",               color: "#f97316" },
  IN_PROGRESS:            { cls: "dashboard-table-badge-status-review",    label: "In Progress",            color: "#f59e0b" },
  RESOLVED:               { cls: "dashboard-table-badge-status-resolved",  label: "Resolved",               color: "#10b981" },
  REJECTED:               { cls: "dashboard-table-badge-priority-high",    label: "Rejected",               color: "#ef4444" },
  ESCALATED:              { cls: "dashboard-table-badge-status-escalated", label: "Escalated",              color: "#f97316" },
  ESCALATED_TO_DISTRICT:  { cls: "dashboard-table-badge-status-escalated", label: "Escalated to District",  color: "#14b8a6" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)"   },
  HIGH:     { label: "High",     color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)"  },
  MEDIUM:   { label: "Medium",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)"  },
  LOW:      { label: "Low",      color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)"  },
};

const UPDATABLE_STATUSES: ApiComplaintStatus[] = [
  "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED", "ESCALATED",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] mb-1" aria-label="Breadcrumb">
      <Link href="/sub-district-admin/dashboard"
        className="hover:text-[var(--color-text-secondary)] transition-colors">
        Dashboard
      </Link>
      <span className="opacity-40">›</span>
      <span className="text-[var(--color-text-secondary)] font-medium">Complaints</span>
    </nav>
  );
}

/** Stats card for the header row */
function StatCard({
  icon: Icon, label, value, color, bg, border, delay,
}: {
  icon: React.ElementType; label: string; value: number;
  color: string; bg: string; border: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <DashboardCard className="p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{ background: bg, borderColor: border }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-[var(--color-text-primary)] tabular-nums">{value}</p>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate">{label}</p>
        </div>
      </DashboardCard>
    </motion.div>
  );
}

/** Status-update modal */
function StatusDrawer({
  complaint, onClose, onUpdate, isUpdating,
}: {
  complaint: ApiComplaint;
  onClose: () => void;
  onUpdate: (id: string, status: ApiComplaintStatus) => Promise<void>;
  isUpdating: boolean;
}) {
  const [selected, setSelected] = useState<ApiComplaintStatus>(complaint.status);
  const [done, setDone] = useState(false);

  const handleUpdate = async () => {
    if (selected === complaint.status) return;
    await onUpdate(complaint.id, selected);
    setDone(true);
    setTimeout(onClose, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-sm rounded-2xl border shadow-xl"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Update Status</h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 font-mono truncate max-w-[200px]">
              {complaint.id.slice(0, 16)}…
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-2">
          {complaint.description && (
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-1">{complaint.description}</p>
          )}
          {UPDATABLE_STATUSES.map((s) => {
            const style = STATUS_STYLE[s];
            const isActive = selected === s;
            return (
              <button key={s} type="button" onClick={() => setSelected(s)}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition-all"
                style={{
                  borderColor: isActive ? `${style.color}50` : "var(--color-border)",
                  background:  isActive ? `${style.color}10` : "var(--color-surface)",
                  color:       isActive ? style.color : "var(--color-text-secondary)",
                }}>
                <span className="font-medium">{style.label}</span>
                {isActive && <CheckCircle2 size={14} style={{ color: style.color }} />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
          <button onClick={onClose}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleUpdate}
            disabled={selected === complaint.status || isUpdating || done}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              borderColor: done ? "rgba(34,197,94,0.4)" : "var(--sda-border-amber)",
              background:  done ? "rgba(34,197,94,0.1)" : "color-mix(in srgb, var(--sda-amber) 12%, transparent)",
              color:       done ? "var(--color-success)" : "var(--sda-amber)",
            }}>
            {isUpdating ? (
              <><Loader2 size={13} className="animate-spin" /> Saving…</>
            ) : done ? (
              <><CheckCircle2 size={13} /> Updated!</>
            ) : "Save"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Toast notification */
function Toast({ message, variant = "success", onDone }: {
  message: string; variant?: "success" | "error"; onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const isErr = variant === "error";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
      style={{
        background: "var(--color-card)",
        borderColor: isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)",
        color: isErr ? "var(--color-error)" : "var(--color-success)",
      }}
    >
      {isErr ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
      {message}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ComplaintsPage() {
  const {
    complaints, total, isLoading, error,
    fetchComplaints, updateComplaintStatus,
  } = useSubDistrictComplaintStore();

  const [activeTab,    setActiveTab]    = useState<ApiComplaintStatus | "ALL">("ALL");
  const [search,       setSearch]       = useState("");
  const [severityF,    setSeverityF]    = useState("");
  const [statusTarget, setStatusTarget] = useState<ApiComplaint | null>(null);
  const [isUpdating,   setIsUpdating]   = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; variant: "success" | "error" } | null>(null);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Computed stats
  const stats = useMemo(() => ({
    total:      complaints.length,
    open:       complaints.filter((c) => c.status === "SUBMITTED" || c.status === "UNDER_REVIEW").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length,
    resolved:   complaints.filter((c) => c.status === "RESOLVED").length,
    escalated:  complaints.filter((c) => c.status === "ESCALATED").length,
  }), [complaints]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (activeTab !== "ALL" && c.status !== activeTab) return false;
      if (severityF && c.severity !== severityF) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false) ||
          c.citizenName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [complaints, activeTab, search, severityF]);

  const handleUpdate = useCallback(async (id: string, status: ApiComplaintStatus) => {
    setIsUpdating(true);
    try {
      await updateComplaintStatus(id, status);
      setToast({ msg: `Status updated to ${STATUS_STYLE[status].label}`, variant: "success" });
    } catch {
      setToast({ msg: "Failed to update status.", variant: "error" });
    } finally {
      setIsUpdating(false);
      setStatusTarget(null);
    }
  }, [updateComplaintStatus]);

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb />

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Complaints</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Manage and resolve citizen complaints for your sub-district
          </p>
        </div>
        <button onClick={() => fetchComplaints()} disabled={isLoading} title="Refresh"
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={BarChart3}  label="Total Complaints" value={stats.total}      color="#f59e0b" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.25)" delay={0.04} />
        <StatCard icon={AlertTriangle} label="Open / Review"  value={stats.open}      color="#ef4444" bg="rgba(239,68,68,0.08)"  border="rgba(239,68,68,0.25)"  delay={0.06} />
        <StatCard icon={TrendingUp}  label="In Progress"      value={stats.inProgress} color="#f97316" bg="rgba(249,115,22,0.08)" border="rgba(249,115,22,0.25)" delay={0.08} />
        <StatCard icon={CheckCircle2} label="Resolved"        value={stats.resolved}   color="#10b981" bg="rgba(16,185,129,0.08)" border="rgba(16,185,129,0.25)" delay={0.1}  />
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && !isLoading && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "var(--color-error)" }}>
            <AlertTriangle size={15} />
            {error} —{" "}
            <button onClick={() => fetchComplaints()} className="underline underline-offset-2 font-medium">
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col overflow-hidden">

          {/* Tabs */}
          <div className="flex gap-0 border-b border-[var(--color-border)] overflow-x-auto [scrollbar-width:none] px-4 pt-3">
            {TABS.map((t) => {
              const count = t.value === "ALL"
                ? complaints.length
                : complaints.filter((c) => c.status === t.value).length;
              return (
                <button key={t.value} onClick={() => setActiveTab(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === t.value
                      ? "border-amber-500 text-amber-400"
                      : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}>
                  {t.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === t.value
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 min-w-[180px] max-w-xs transition-colors focus-within:border-amber-500/40"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, description, citizen…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full" />
              {search && (
                <button onClick={() => setSearch("")} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="relative">
              <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              <select value={severityF} onChange={(e) => setSeverityF(e.target.value)}
                className="h-9 appearance-none rounded-lg border pl-7 pr-7 text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none focus:border-amber-500/40">
                <option value="">All Severities</option>
                {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                  <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                ))}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* Body */}
          {isLoading && complaints.length === 0 ? (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-[var(--color-text-muted)]">
              <Loader2 size={16} className="animate-spin" />
              Loading complaints…
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                style={{ borderColor: "var(--sda-border-amber)", background: "var(--sda-amber-glow)" }}>
                <FileWarning size={24} style={{ color: "var(--sda-amber)" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">No complaints found</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Adjust filters or search query</p>
              </div>
              {(search || severityF || activeTab !== "ALL") && (
                <button
                  onClick={() => { setSearch(""); setSeverityF(""); setActiveTab("ALL"); }}
                  className="text-xs text-amber-400 hover:underline underline-offset-2">
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <div className="dashboard-table-scroll flex-1">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    {["ID", "Description", "Severity", "Citizen", "Reported", "Status", "Actions"].map((h) => (
                      <th key={h} className="dashboard-table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((c, i) => {
                      const statusStyle = STATUS_STYLE[c.status];
                      const sev = SEVERITY_CONFIG[c.severity] ?? SEVERITY_CONFIG.MEDIUM;
                      return (
                        <motion.tr key={c.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="dashboard-table-row sda-table-row">

                          {/* ID */}
                          <td className="dashboard-table-td dashboard-table-td-primary font-mono text-xs">
                            <span className="text-amber-400 font-bold">{c.id.slice(0, 8)}…</span>
                          </td>

                          {/* Description */}
                          <td className="dashboard-table-td text-xs max-w-[200px] truncate"
                            title={c.description ?? ""}>
                            {c.description ?? (
                              <span className="text-[var(--color-text-muted)] italic">No description</span>
                            )}
                          </td>

                          {/* Severity */}
                          <td className="dashboard-table-td">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border"
                              style={{ color: sev.color, borderColor: sev.border, background: sev.bg }}>
                              {sev.label}
                            </span>
                          </td>

                          {/* Citizen */}
                          <td className="dashboard-table-td text-xs whitespace-nowrap font-medium text-[var(--color-text-secondary)]">
                            {c.citizenName}
                          </td>

                          {/* Date */}
                          <td className="dashboard-table-td text-xs font-mono whitespace-nowrap">
                            <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                              <Clock size={10} />
                              {fmtDate(c.createdAt)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="dashboard-table-td">
                            <span className={`dashboard-table-badge ${statusStyle.cls}`}>
                              {statusStyle.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="dashboard-table-td">
                            <div className="flex items-center gap-1">
                              <Link href={`/sub-district-admin/dashboard/complaints/${c.id}`}>
                                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                                  className="flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-medium transition-colors"
                                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }}
                                  title="View detail">
                                  <Eye size={11} /> View
                                </motion.button>
                              </Link>
                              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setStatusTarget(c)}
                                className="flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-medium transition-colors"
                                style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "var(--color-success)" }}
                                title="Update status">
                                <CheckCircle2 size={11} /> Update
                              </motion.button>
                              <a href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
                                target="_blank" rel="noopener noreferrer">
                                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                                  className="flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-medium transition-colors"
                                  style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "var(--color-info)" }}
                                  title="Open in Maps">
                                  <MapPin size={11} />
                                </motion.button>
                              </a>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Showing <span className="font-semibold text-[var(--color-text-secondary)]">{filtered.length}</span> of{" "}
              <span className="font-semibold text-[var(--color-text-secondary)]">{total}</span> complaints
            </span>
            <Link href="/sub-district-admin/dashboard"
              className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
              Back to dashboard <ChevronRight size={11} />
            </Link>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Status update modal */}
      <AnimatePresence>
        {statusTarget && (
          <StatusDrawer
            complaint={statusTarget}
            onClose={() => setStatusTarget(null)}
            onUpdate={handleUpdate}
            isUpdating={isUpdating}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.msg} variant={toast.variant} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
