"use client";

/**
 * District Admin — Escalated Complaints
 *
 * Fetches real complaints from GET /api/admin/my-district/escalations.
 * Shows an ESCALATED badge for ESCALATED_TO_DISTRICT status, an "Escalated"
 * filter tab, escalatedBy admin name and escalatedAt timestamp.
 *
 * Design tokens: teal primary, amber XP accent, neumorphic neu-card-lg,
 * DM Sans + DM Mono, CSS variables only.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShieldAlert, Search, Clock, CheckCircle2, X,
  RotateCcw, AlertTriangle, Info, Calendar, MapPin,
  ArrowUpRight, Loader2, UserCheck,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { api } from "@/lib/api";
import { shouldUseMock } from "@/lib/useMock";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DistrictComplaint {
  id: string;
  ticketNumber: string;
  category: string;
  severity: string;
  status: string;
  description: string | null;
  address: string | null;
  escalationLevel: number;
  escalatedAt: string | null;
  escalatedBy: string | null;
  escalationReason: string | null;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type StatusFilter = "ALL" | "ESCALATED_TO_DISTRICT" | "RESOLVED" | "REJECTED" | "IN_PROGRESS";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

const MOCK_COMPLAINTS: DistrictComplaint[] = [
  {
    id: "mock-1", ticketNumber: "RW-IN-2026-000042", category: "POTHOLE",
    severity: "HIGH", status: "ESCALATED_TO_DISTRICT",
    description: "Large pothole on NH-48 causing traffic hazard",
    address: "NH-48, near Panvel Toll Plaza", escalationLevel: 1,
    escalatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    escalatedBy: "Officer R. Sharma",
    escalationReason: "MANUAL_ESCALATION",
    slaDeadline: new Date(Date.now() + 46 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-2", ticketNumber: "RW-IN-2026-000038", category: "CRACKS_DAMAGE",
    severity: "CRITICAL", status: "ESCALATED_TO_DISTRICT",
    description: "Severe road cracks on bridge approach",
    address: "Alibag-Revdanda Road, Bridge approach", escalationLevel: 1,
    escalatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    escalatedBy: "Officer P. Nair",
    escalationReason: "Technical Expertise Required",
    slaDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Teal ESCALATED badge — fades in with Framer Motion */
function EscalatedBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
      style={{
        borderColor: "rgba(20,184,166,0.4)",
        background: "rgba(20,184,166,0.12)",
        color: "#14b8a6",
      }}
    >
      <ShieldAlert size={10} />
      ESCALATED
    </motion.span>
  );
}

/** Status badge for any status string */
function StatusBadge({ status }: { status: string }) {
  if (status === "ESCALATED_TO_DISTRICT") return <EscalatedBadge />;

  const cfg: Record<string, { bg: string; border: string; color: string; label: string }> = {
    RESOLVED:    { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", color: "#10b981", label: "Resolved" },
    REJECTED:    { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  color: "#ef4444", label: "Rejected" },
    IN_PROGRESS: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "In Progress" },
    ESCALATED:   { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", color: "#f97316", label: "Escalated" },
  };
  const c = cfg[status] ?? { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)", color: "#94a3b8", label: status };

  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold"
      style={{ background: c.bg, borderColor: c.border, color: c.color }}>
      {c.label}
    </span>
  );
}

/** Complaint row — shows ticket, description, escalation metadata, status badge */
function ComplaintRow({ c, index }: { c: DistrictComplaint; index: number }) {
  const sevColor = SEVERITY_COLOR[c.severity] ?? "#94a3b8";
  const escalatedAt = c.escalatedAt
    ? new Date(c.escalatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
  const isEscalatedToDistrict = c.status === "ESCALATED_TO_DISTRICT";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      exit={{ opacity: 0 }}
      className="dashboard-table-row da-table-row group"
    >
      {/* Ticket + description */}
      <td className="dashboard-table-td">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] font-bold" style={{ color: "var(--da-teal)" }}>
            {c.ticketNumber}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] line-clamp-1 max-w-[200px]">
            {c.description ?? "—"}
          </span>
        </div>
      </td>

      {/* Category */}
      <td className="dashboard-table-td whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
        {c.category.replace(/_/g, " ")}
      </td>

      {/* Severity */}
      <td className="dashboard-table-td">
        <span className="text-[11px] font-bold" style={{ color: sevColor }}>{c.severity}</span>
      </td>

      {/* Status */}
      <td className="dashboard-table-td">
        <StatusBadge status={c.status} />
      </td>

      {/* Escalated by + at */}
      <td className="dashboard-table-td">
        {isEscalatedToDistrict ? (
          <div className="flex flex-col gap-0.5">
            {c.escalatedBy && (
              <span className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
                <UserCheck size={10} className="text-teal-400 shrink-0" />
                {c.escalatedBy}
              </span>
            )}
            {escalatedAt && (
              <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                <Calendar size={9} className="shrink-0" />
                {escalatedAt}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-[var(--color-text-muted)]">—</span>
        )}
      </td>

      {/* Address */}
      <td className="dashboard-table-td">
        <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] max-w-[160px] truncate">
          <MapPin size={10} className="shrink-0" />
          {c.address ?? "Unknown location"}
        </span>
      </td>

      {/* Actions */}
      <td className="dashboard-table-td">
        <Link href={`/district-admin/dashboard/complaints/${c.id}`}>
          <motion.span
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition-colors"
            style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}
            title="View Details"
          >
            <ArrowUpRight size={13} />
          </motion.span>
        </Link>
      </td>
    </motion.tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All",        value: "ALL" },
  { label: "Escalated",  value: "ESCALATED_TO_DISTRICT" },
  { label: "In Progress",value: "IN_PROGRESS" },
  { label: "Resolved",   value: "RESOLVED" },
  { label: "Rejected",   value: "REJECTED" },
];

export default function DistrictComplaintsPage() {
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  const [complaints, setComplaints] = useState<DistrictComplaint[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusFilter>("ESCALATED_TO_DISTRICT");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const fetchComplaints = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isMock) {
          await new Promise((r) => setTimeout(r, 400));
          if (!cancelled) {
            setComplaints(MOCK_COMPLAINTS);
            setPagination({ total: MOCK_COMPLAINTS.length, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false });
            setLoading(false);
          }
          return;
        }
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (activeTab !== "ALL") params.status = activeTab;
        const res = await api.get("/api/admin/my-district/escalations", { params });
        if (!cancelled) {
          const data = res.data?.data;
          setComplaints(data?.complaints ?? []);
          setPagination(data?.pagination ?? null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load complaints.");
          setLoading(false);
        }
      }
    };
    fetchComplaints();
    return () => { cancelled = true; };
  }, [isMock, activeTab, page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return complaints;
    const q = search.toLowerCase();
    return complaints.filter((c) =>
      c.ticketNumber.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q) ||
      (c.address ?? "").toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }, [complaints, search]);

  const escalatedCount = complaints.filter((c) => c.status === "ESCALATED_TO_DISTRICT").length;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{ background: "rgba(20,184,166,0.1)", borderColor: "rgba(20,184,166,0.3)" }}>
            <ShieldAlert size={16} style={{ color: "#14b8a6" }} />
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            Escalated Complaints
          </h1>
          {escalatedCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
              style={{ background: "rgba(20,184,166,0.2)", color: "#14b8a6" }}
            >
              {escalatedCount}
            </motion.span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] pl-0.5">
          Complaints escalated from sub-district level to your district for review.
        </p>
      </motion.div>

      {/* Status filter tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DashboardCard className="p-1 flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.value;
            const isEscalatedTab = tab.value === "ESCALATED_TO_DISTRICT";
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => { setActiveTab(tab.value); setPage(1); }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active
                    ? isEscalatedTab ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.08)"
                    : "transparent",
                  color: active
                    ? isEscalatedTab ? "#14b8a6" : "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                  borderBottom: active && isEscalatedTab ? "2px solid #14b8a6" : "2px solid transparent",
                }}
              >
                {isEscalatedTab && <ShieldAlert size={11} />}
                {tab.label}
              </button>
            );
          })}
        </DashboardCard>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DashboardCard className="p-3">
          <div className="flex items-center gap-2 rounded-lg border h-9 px-3"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <Search size={13} className="shrink-0 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket, description, address, category…"
              className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X size={12} />
              </button>
            )}
          </div>
        </DashboardCard>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <DashboardCard className="flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {activeTab === "ESCALATED_TO_DISTRICT" ? "Escalated to District" : "All Complaints"}
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                {loading ? "Loading…" : `${filtered.length} complaint${filtered.length !== 1 ? "s" : ""}`}
                {search && ` matching "${search}"`}
              </p>
            </div>
            {search && (
              <button onClick={() => setSearch("")}
                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <RotateCcw size={11} /> Clear
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2">
              <Loader2 size={16} className="animate-spin" style={{ color: "#14b8a6" }} />
              <span className="text-sm text-[var(--color-text-muted)]">Loading complaints…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
              style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "var(--color-danger)" }}>
              <AlertTriangle size={14} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                style={{ background: "rgba(20,184,166,0.08)", borderColor: "rgba(20,184,166,0.25)" }}>
                <CheckCircle2 size={24} style={{ color: "#14b8a6" }} />
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">No complaints found</p>
              <p className="text-xs text-[var(--color-text-muted)] text-center max-w-xs">
                {activeTab === "ESCALATED_TO_DISTRICT"
                  ? "No complaints have been escalated to your district yet."
                  : "No complaints match the current filter."}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <div className="dashboard-table-scroll" style={{ maxHeight: "32rem" }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    {["Ticket / Description", "Category", "Severity", "Status", "Escalated By / At", "Location", "Actions"]
                      .map((h) => <th key={h} className="dashboard-table-th">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((c, i) => (
                      <ComplaintRow key={c.id} c={c} index={i} />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </motion.div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-2">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => setPage((p) => p - 1)}
            className="h-8 px-3 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
          >
            Previous
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 px-3 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
          >
            Next
          </button>
        </motion.div>
      )}
    </div>
  );
}
