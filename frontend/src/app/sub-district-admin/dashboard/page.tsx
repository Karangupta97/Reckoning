"use client";

import { Suspense, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  AlertTriangle, ClipboardList, Clock3, CheckCircle2,
  MapPin, Ticket, Eye, TrendingUp, TrendingDown, Minus,
  Activity, Users, FileWarning, Upload, Map, Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { MapLoadingSkeleton } from "@/components/map/map-loading-skeleton";
import { ComplaintTrendChart, ResolutionRateChart } from "@/components/district-admin-dashboard";
import { useSubDistrictDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { formatSlaLabel } from "@/lib/dashboard-metrics";
import { PendingClarificationsWidget } from "@/components/admin/PendingClarificationsWidget";
import { useSubDistrictInfo } from "@/hooks/useSubDistrictInfo";
import { useSubDistrictComplaintStore } from "@/store/subDistrictComplaintStore";
import type { ComplaintRecord } from "@/store/complaintStore";

// Lazy load the map component with no server-side rendering
const IndiaMap = dynamic(() => import("@/components/map/IndiaMap"), {
  ssr: false,
});

type SubDistrictMetrics = ReturnType<typeof useSubDistrictDashboardMetrics>;

/* ─── Hero — compact ─────────────────────────────────────────── */
function HeroBanner({ m }: { m: SubDistrictMetrics }) {
  const { subDistrictName, districtName, subDistrictOpsLabel } = useSubDistrictInfo();
  const zoneLabel = m.zoneHealth >= 85 ? "Excellent" : m.zoneHealth >= 70 ? "Good" : "At Risk";
  const zoneColor = m.zoneHealth >= 85 ? "text-green-400" : m.zoneHealth >= 70 ? "text-amber-400" : "text-red-400";
  const barColor = m.zoneHealth >= 85 ? "bg-green-400" : m.zoneHealth >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border py-4 px-5"
      style={{
        borderColor: "var(--sda-border-amber)",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--sda-amber) 7%, var(--color-card)) 0%, var(--color-card) 55%)",
      }}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full opacity-15 blur-3xl" style={{ background: "var(--sda-amber)" }} aria-hidden />
      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium"
              style={{ borderColor: "rgba(34,197,94,0.3)", color: "var(--color-success)", background: "rgba(34,197,94,0.08)" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              Live Operations
            </span>
            <span className="flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium"
              style={{ borderColor: "var(--sda-border-amber)", color: "var(--sda-amber)", background: "var(--sda-amber-glow)" }}>
              <MapPin size={9} /> {districtName} • {subDistrictName}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{subDistrictOpsLabel}</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Manage complaints, inspections, tickets and field resolution workflows.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sub-district-admin/dashboard/tickets?create=1">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-all"
                style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 12%, transparent)", color: "var(--sda-amber)" }}>
                <Plus size={12} /> Create Ticket
              </motion.button>
            </Link>
            <Link href="/sub-district-admin/dashboard/map">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-all"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
                <Map size={12} /> View Map
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Right — zone health + metric pills */}
        <div className="flex items-center gap-4 lg:shrink-0">
          {/* Zone Health */}
          <div className="flex items-center gap-3 rounded-xl border px-4 py-2.5"
            style={{ borderColor: "var(--sda-border-amber)", background: "var(--sda-amber-glow)" }}>
            <div className="text-center">
              <div className="text-2xl font-black tabular-nums" style={{ color: "var(--sda-amber)" }}>{m.zoneHealth}</div>
              <div className="text-[9px] text-[var(--color-text-muted)]">/100</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[var(--color-text-primary)]">Zone Health</div>
              <div className={`text-[10px] font-medium ${zoneColor}`}>{zoneLabel}</div>
              <div className="mt-1 h-1 w-16 rounded-full bg-[var(--color-surface)] overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${m.zoneHealth}%` }} />
              </div>
            </div>
          </div>

          {/* Metric pills */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Open",      value: String(m.open), color: "var(--color-danger)" },
              { label: "Tickets",   value: String(m.activeTickets), color: "var(--color-info)"   },
              { label: "SLA Today", value: String(m.slaWarning),  color: "var(--sda-amber)"    },
              { label: "Resolved",  value: String(m.resolved), color: "var(--color-success)" },
            ].map((p) => (
              <div key={p.label} className="rounded-lg border px-2.5 py-1.5 text-center min-w-[54px]"
                style={{ borderColor: `color-mix(in srgb, ${p.color} 25%, transparent)`, background: `color-mix(in srgb, ${p.color} 8%, transparent)` }}>
                <div className="text-sm font-black tabular-nums" style={{ color: p.color }}>{p.value}</div>
                <div className="text-[9px] text-[var(--color-text-muted)] leading-tight">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type KpiCardData = {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: typeof AlertTriangle;
  iconColor: string;
  borderColor: string;
  href: string;
};

function buildKpiCards(m: SubDistrictMetrics): KpiCardData[] {
  return [
    { title: "Open Complaints", value: String(m.open), change: `${m.escalated} escalated`, trend: "up", icon: AlertTriangle, iconColor: "var(--color-danger)", borderColor: "rgba(239,68,68,0.3)", href: "/sub-district-admin/dashboard/complaints" },
    { title: "Assigned Tickets", value: String(m.activeTickets), change: `${m.openTickets} open`, trend: "neutral", icon: ClipboardList, iconColor: "var(--color-info)", borderColor: "rgba(59,130,246,0.3)", href: "/sub-district-admin/dashboard/tickets" },
    { title: "SLA Due Today", value: String(m.slaWarning), change: `${m.sla.critical} critical`, trend: m.slaWarning > 0 ? "up" : "down", icon: Clock3, iconColor: "var(--sda-amber)", borderColor: "rgba(245,158,11,0.3)", href: "/sub-district-admin/dashboard/complaints" },
    { title: "Resolved Today", value: String(m.resolved), change: `${m.pendingResolutions} pending`, trend: "down", icon: CheckCircle2, iconColor: "var(--color-success)", borderColor: "rgba(34,197,94,0.3)", href: "/sub-district-admin/dashboard/complaints" },
  ];
}

function KpiCard({ card, index }: { card: KpiCardData; index: number }) {
  const TrendIcon = card.trend === "up" ? TrendingUp : card.trend === "down" ? TrendingDown : Minus;
  const trendColor = card.trend === "down" ? "var(--color-success)" : card.trend === "up" ? "var(--color-danger)" : "var(--color-text-muted)";
  return (
    <Link href={card.href}>
      <DashboardCard
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="px-4 py-3.5 cursor-pointer transition-all duration-200 hover:border-[var(--color-border)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: card.borderColor, background: `color-mix(in srgb, ${card.iconColor} 10%, transparent)` }}>
            <card.icon size={17} style={{ color: card.iconColor }} />
          </div>
          <div className="flex items-center gap-0.5 text-[10px]" style={{ color: trendColor }}>
            <TrendIcon size={11} />
            <span>{card.change}</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black tabular-nums text-[var(--color-text-primary)]">{card.value}</div>
          <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{card.title}</div>
        </div>
      </DashboardCard>
    </Link>
  );
}

/* ─── SLA Command Center ─────────────────────────────────────── */
function SlaCommandCenter({ m }: { m: SubDistrictMetrics }) {
  const total = Math.max(m.sla.total, 1);
  const segments = [
    { label: "Critical", count: m.sla.critical, color: "var(--color-danger)", pulse: true },
    { label: "Warning", count: m.sla.warning, color: "var(--sda-amber)", pulse: false },
    { label: "Healthy", count: m.sla.healthy, color: "var(--color-success)", pulse: false },
  ];
  return (
    <DashboardCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-4 py-3.5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">SLA Command Center</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Real-time SLA status across all active complaints</p>
        </div>
        <Activity size={16} className="text-[var(--color-text-muted)]" />
      </div>
      <div className="flex flex-row gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex-1 flex items-center justify-between rounded-lg border px-3 py-2"
            style={{ borderColor: `color-mix(in srgb, ${s.color} 25%, transparent)`, background: `color-mix(in srgb, ${s.color} 7%, transparent)` }}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {s.pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: s.color }} />}
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: s.color }} />
              </span>
              <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
            </div>
            <span className="text-lg font-black tabular-nums" style={{ color: s.color }}>{s.count}</span>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full">
          <div className="h-full bg-red-500" style={{ width: `${(m.sla.critical / total) * 100}%` }} />
          <div className="h-full" style={{ width: `${(m.sla.warning / total) * 100}%`, background: "var(--sda-amber)" }} />
          <div className="h-full bg-green-500" style={{ width: `${(m.sla.healthy / total) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-red-400">{m.sla.critical} critical</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{m.sla.total} total</span>
          <span className="text-[10px] text-green-400">{m.sla.healthy} healthy</span>
        </div>
      </div>
    </DashboardCard>
  );
}

function complaintRow(c: ComplaintRecord) {
  return {
    id: c.id,
    priority: c.priority,
    sla: formatSlaLabel(c),
    officer: c.officer,
    status: c.status,
  };
}

const SEVERITY_PRIORITY: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const API_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Open",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  ESCALATED: "Escalated",
  DRAFT: "Draft",
};

/* ─── Urgent Actions Table (real data from backend) ──────────── */
function UrgentActionsTable() {
  const { complaints, isLoading, fetchComplaints } = useSubDistrictComplaintStore();

  useEffect(() => {
    fetchComplaints({ limit: 10 });
  }, [fetchComplaints]);

  // Sort: CRITICAL first, then HIGH, then by date
  const sorted = useMemo(() => {
    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...complaints]
      .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
      .slice(0, 10);
  }, [complaints]);

  return (
    <DashboardCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Urgent Actions</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Real complaints — sorted by severity</p>
        </div>
        <Link href="/sub-district-admin/dashboard/complaints"
          className="text-[11px] font-medium hover:underline" style={{ color: "var(--sda-amber)" }}>
          View All →
        </Link>
      </div>
      <div className="dashboard-table-scroll flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={14} className="animate-spin text-amber-400" />
            <span className="text-xs text-[var(--color-text-muted)]">Loading complaints…</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-[var(--color-text-muted)]">No complaints in your jurisdiction yet.</span>
          </div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>{["ID", "Severity", "Description", "Status", "Action"].map((h) => (
                <th key={h} className="dashboard-table-th">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const priority = SEVERITY_PRIORITY[row.severity] ?? "Medium";
                const status = API_STATUS_LABEL[row.status] ?? row.status;
                return (
                  <tr key={row.id} className="dashboard-table-row sda-table-row">
                    <td className="dashboard-table-td dashboard-table-td-primary font-mono text-[10px]">{row.id.slice(0, 10)}…</td>
                    <td className="dashboard-table-td">
                      <span className={`dashboard-table-badge ${priority === "Critical" ? "dashboard-table-badge-status-open" : priority === "High" ? "dashboard-table-badge-status-escalated" : "dashboard-table-badge-status-review"}`}>
                        {priority}
                      </span>
                    </td>
                    <td className="dashboard-table-td text-xs max-w-[200px] truncate">{row.description?.slice(0, 50) ?? "—"}</td>
                    <td className="dashboard-table-td">
                      <span className={`dashboard-table-badge ${
                        status === "Open" || status === "Escalated" ? "dashboard-table-badge-status-open" :
                        status === "In Progress" || status === "Under Review" ? "dashboard-table-badge-status-review" :
                        status === "Resolved" ? "dashboard-table-badge-status-resolved" : "dashboard-table-badge-status-escalated"
                      }`}>{status}</span>
                    </td>
                    <td className="dashboard-table-td">
                      <Link href={`/sub-district-admin/dashboard/complaints/${row.id}`}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium"
                          style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", color: "var(--sda-amber)" }}>
                          <Eye size={11} /> View
                        </motion.button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardCard>
  );
}

/* ─── Quick Actions ──────────────────────────────────────────── */
function QuickActionsPanel() {
  const actions = [
    { label: "Create Ticket",     desc: "Open a new work order",   icon: Ticket,       href: "/sub-district-admin/dashboard/tickets?create=1", color: "var(--sda-amber)"        },
    { label: "Resolve Complaint", desc: "Close a complaint case",  icon: CheckCircle2, href: "/sub-district-admin/dashboard/complaints", color: "var(--color-success)"    },
    { label: "Upload Evidence",   desc: "Add photos or documents", icon: Upload,       href: "/sub-district-admin/dashboard/complaints", color: "var(--color-info)"       },
    { label: "Open Zone Map",     desc: "View complaint heatmap",  icon: Map,          href: "/sub-district-admin/dashboard/map",        color: "var(--color-text-muted)" },
  ];
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="p-4 flex flex-col gap-3"
    >
      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Quick Actions</h3>
      <div className="flex flex-col gap-2">
        {actions.map((a) => (
          <Link key={a.label} href={a.href}>
            <motion.div
              whileHover={{ x: 2, transition: { duration: 0.15 } }}
              className="flex items-center gap-3 rounded-lg border px-3 transition-all duration-150 cursor-pointer"
              style={{
                height: "56px",
                borderColor: `color-mix(in srgb, ${a.color} 18%, var(--color-border))`,
                background: `color-mix(in srgb, ${a.color} 5%, transparent)`,
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                style={{
                  borderColor: `color-mix(in srgb, ${a.color} 28%, transparent)`,
                  background: `color-mix(in srgb, ${a.color} 10%, transparent)`,
                }}
              >
                <a.icon size={14} style={{ color: a.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--color-text-primary)]">{a.label}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{a.desc}</div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}

/* ─── Officer Workload ───────────────────────────────────────── */
function OfficerWorkload({ officers }: { officers: SubDistrictMetrics["officers"] }) {
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      className="flex flex-col overflow-hidden"
    >
      <div className="px-4 pt-3 pb-2 shrink-0">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Officer Workload</h3>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Active case distribution</p>
      </div>
      {/* Fixed-layout table — no horizontal scroll */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "248px", scrollbarWidth: "thin" }}>
        <table style={{ tableLayout: "fixed", width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              {["Officer","Cases","SLA Risk","Status"].map((h) => (
                <th key={h} className="dashboard-table-th text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {officers.map((o) => (
              <tr key={o.name} className="dashboard-table-row sda-table-row" style={{ height: "44px" }}>
                <td className="dashboard-table-td dashboard-table-td-primary text-xs truncate max-w-0">
                  <span className="block truncate">{o.name}</span>
                </td>
                <td className="dashboard-table-td font-bold text-xs tabular-nums">{o.cases}</td>
                <td className="dashboard-table-td pr-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 rounded-full overflow-hidden bg-[var(--color-surface)]">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${o.slaRisk}%`,
                        background: o.slaRisk >= 60 ? "var(--color-danger)" : o.slaRisk >= 40 ? "var(--sda-amber)" : "var(--color-success)",
                      }} />
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums shrink-0">{o.slaRisk}%</span>
                  </div>
                </td>
                <td className="dashboard-table-td">
                  <span className={`dashboard-table-badge text-[10px] ${
                    o.status === "Overloaded" ? "dashboard-table-badge-status-open" :
                    o.status === "On Leave"   ? "dashboard-table-badge-status-escalated" : "dashboard-table-badge-status-resolved"
                  }`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}

/* ─── Workload Overview ──────────────────────────────────────── */
function WorkloadOverview({ workload }: { workload: SubDistrictMetrics["workload"] }) {
  const stats = [
    { label: "Pending",     value: String(workload.pending),    color: "var(--sda-amber)"     },
    { label: "In Progress", value: String(workload.inProgress), color: "var(--color-info)"    },
    { label: "Awaiting",    value: String(workload.awaiting),   color: "#a78bfa"              },
    { label: "Done Today",  value: String(workload.doneToday),  color: "var(--color-success)" },
  ];
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="p-4"
    >
      <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2.5">Workload Overview</h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border px-3 py-2"
            style={{
              borderColor: `color-mix(in srgb, ${s.color} 22%, transparent)`,
              background: `color-mix(in srgb, ${s.color} 6%, transparent)`,
            }}
          >
            <div className="text-lg font-black tabular-nums leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] leading-tight mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

/* ─── Citizen Impact ─────────────────────────────────────────── */
function CitizenImpact({ m }: { m: SubDistrictMetrics }) {
  const totalComplaints = m.totalComplaints;
  const resolved = m.resolved;
  const escalated = m.escalated;
  const escalationRate = totalComplaints > 0 ? Math.round((escalated / totalComplaints) * 100) : 0;
  const resolutionDays = totalComplaints > 0 ? "2.4d" : "—";

  const stats = [
    { label: "Citizens Impacted",  value: String(totalComplaints * 3), color: "var(--color-danger)"  },
    { label: "Roads Affected",     value: String(totalComplaints), color: "var(--sda-amber)"     },
    { label: "Avg Resolution",     value: resolutionDays,  color: "var(--color-info)"    },
    { label: "Repeat Complaints",  value: `${Math.round(totalComplaints * 0.08)}`, color: "var(--sda-orange)"    },
    { label: "Escalation Rate",    value: `${escalationRate}%`, color: "var(--color-text-muted)" },
    { label: "Resolved",           value: String(resolved),   color: "var(--color-success)" },
  ];
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
      className="p-4"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Users size={14} className="text-blue-400" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Citizen Impact</h3>
      </div>
      <div className="flex flex-col divide-y divide-[var(--color-border)]">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
            <span className="text-xs text-[var(--color-text-secondary)]">{s.label}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

/* ─── Heatmap Preview ────────────────────────────────────────── */
function HeatmapPreview({ openCount }: { openCount: number }) {
  return (
    <DashboardCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="px-4 py-3.5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Complaint Heatmap</h3>
        <span className="text-[10px] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded px-1.5 py-0.5">Zone A</span>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden" style={{ minHeight: "160px" }}>
        <Suspense fallback={<MapLoadingSkeleton />}>
          <IndiaMap
            adminRole="sub_district_admin"
            height="160px"
            showBreadcrumb={false}
            showControls={false}
            showLegend={false}
            showSidebar={false}
            isDark
          />
        </Suspense>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-muted)]">{openCount} open complaints</span>
        <Link href="/sub-district-admin/dashboard/map" className="text-[10px] font-medium" style={{ color: "var(--sda-amber)" }}>Open Zone Map →</Link>
      </div>
    </DashboardCard>
  );
}

/* ─── Activity Feed ──────────────────────────────────────────── */
const feedEvents = [
  { time: "08:14", title: "Complaint Assigned",   desc: "#CMP-1024 → R. Sharma",         iconClass: "activity-timeline-icon-amber",   icon: FileWarning   },
  { time: "09:22", title: "Evidence Uploaded",    desc: "3 photos — #CMP-0987",          iconClass: "activity-timeline-icon-info",    icon: Upload        },
  { time: "10:05", title: "Inspection Completed", desc: "Site verified — Sector 7",       iconClass: "activity-timeline-icon-success", icon: CheckCircle2  },
  { time: "11:31", title: "Ticket Closed",        desc: "#TKT-0456 by P. Nair",          iconClass: "activity-timeline-icon-success", icon: Ticket        },
  { time: "12:48", title: "SLA Breach Warning",   desc: "#CMP-1011 — 1h 22m left",       iconClass: "activity-timeline-icon-danger",  icon: AlertTriangle },
  { time: "13:15", title: "Complaint Resolved",   desc: "#CMP-0924 closed",              iconClass: "activity-timeline-icon-success", icon: CheckCircle2  },
];

function ActivityFeed() {
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
      className="p-4 flex flex-col h-full"
    >
      <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2.5 shrink-0">Activity Feed</h3>
      <div className="activity-timeline flex-1 min-h-0 overflow-hidden">
        <div className="sda-activity-timeline-line activity-timeline-line" />
        <div
          className="activity-timeline-list overflow-y-auto"
          style={{ maxHeight: "220px", scrollbarWidth: "thin", scrollbarColor: "rgba(245,158,11,0.2) transparent" }}
        >
          {feedEvents.map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.04 }}
              className="activity-timeline-item"
            >
              <div className={`activity-timeline-icon ${ev.iconClass}`}><ev.icon size={13} /></div>
              <div className="activity-timeline-body">
                <div className="activity-timeline-meta">
                  <span className="activity-timeline-title">{ev.title}</span>
                  <span className="activity-timeline-time">{ev.time}</span>
                </div>
                <p className="activity-timeline-desc">{ev.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

/* ─── Upcoming SLA Breaches (Section F) ─────────────────────── */
function UpcomingSLABreaches({ items }: { items: ComplaintRecord[] }) {
  return (
    <DashboardCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Upcoming SLA Breaches</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Act before these breach SLA</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
          </span>
          {items.length} at risk
        </span>
      </div>
      <div className="flex flex-col divide-y divide-[var(--color-border)] px-4 pb-2">
        {items.map((item) => (
          <Link key={item.id} href={`/sub-district-admin/dashboard/complaints/${item.id}`}>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between gap-3 py-2 cursor-pointer group">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${item.priority === "Critical" ? "bg-red-400 animate-pulse" : item.priority === "High" ? "bg-amber-400" : "bg-blue-400"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate group-hover:text-amber-400 transition-colors">{item.title}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{item.id} · {item.officer}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: item.priority === "Critical" ? "var(--color-danger)" : "var(--sda-amber)" }}>
                {formatSlaLabel(item)}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}

/* ─── Recent Resolutions (Section F) ────────────────────────── */
function RecentResolutions({ items }: { items: ComplaintRecord[] }) {
  return (
    <DashboardCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Recent Resolutions</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Completed today · {items.length} cases</p>
        </div>
        <span className="text-[10px] font-medium text-green-400">All within SLA ✓</span>
      </div>
      <div className="flex flex-col divide-y divide-[var(--color-border)] px-4 pb-2">
        {items.map((item) => (
          <Link key={item.id} href={`/sub-district-admin/dashboard/complaints/${item.id}`}>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between gap-3 py-2 cursor-pointer group">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                  style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
                  <CheckCircle2 size={12} className="text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] truncate group-hover:text-green-400 transition-colors">{item.title}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{item.id} · {item.officer}</p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">{item.updatedDate.split(",")[0]}</span>
                <span className="text-[9px] text-green-400">{item.category}</span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}

/* ─── Full-width Heatmap Panel (Section D) ───────────────────── */
function HeatmapPanel({ m }: { m: SubDistrictMetrics }) {
  const { subDistrictName } = useSubDistrictInfo();
  return (
    <DashboardCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 pb-2.5 border-b border-[var(--color-border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Complaint Heatmap — Zone A</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{subDistrictName} · {m.open} active complaints · Live data</p>
        </div>
        <Link href="/sub-district-admin/dashboard/map"
          className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:underline"
          style={{ color: "var(--sda-amber)" }}>
          <Map size={12} /> Full Map
        </Link>
      </div>

      {/* Real interactive map */}
      <Suspense fallback={<MapLoadingSkeleton />}>
        <IndiaMap
          adminRole="sub_district_admin"
          height="380px"
          showBreadcrumb
          showControls
          showLegend
          showSidebar
          isDark
        />
      </Suspense>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 border-t border-[var(--color-border)]">
        {[
          { label: "Open Complaints", value: String(m.open), color: "var(--color-danger)" },
          { label: "Critical Zones", value: String(m.sla.critical), color: "var(--color-danger)" },
          { label: "Active Tickets", value: String(m.activeTickets), color: "var(--color-info)" },
          { label: "Resolved Today", value: String(m.resolved), color: "var(--color-success)" },
          { label: "Zone Health", value: `${m.zoneHealth}%`, color: "var(--sda-amber)" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.value}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function SubDistrictAdminDashboard() {
  const m = useSubDistrictDashboardMetrics();
  const kpiCards = buildKpiCards(m);

  return (
    <div className="flex flex-col gap-3">
      {/* Hero — full width */}
      <HeroBanner m={m} />

      {/* 4-col KPI strip — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((card, i) => <KpiCard key={card.title} card={card} index={i} />)}
      </div>

      {/* SLA Command Center — full width */}
      <SlaCommandCenter m={m} />

      {/* Pending Clarifications — compact widget */}
      <PendingClarificationsWidget portal="sub-district" compact />

      {/* Urgent Actions — full width */}
      <UrgentActionsTable />

      {/* 70/30 — Officer Workload | Quick Actions */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[65fr_35fr] lg:[&>*]:self-stretch">
        <OfficerWorkload officers={m.officers} />
        <QuickActionsPanel />
      </div>

      {/* Equal thirds — Citizen Impact | Workload Overview | Activity Feed */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[25fr_35fr_40fr] lg:[&>*]:self-stretch">
        <CitizenImpact m={m} />
        <WorkloadOverview workload={m.workload} />
        <ActivityFeed />
      </div>

      {/* Complaint Heatmap — full width */}
      <HeatmapPanel m={m} />

      {/* 50/50 — Resolution Rate | Complaint Trend */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:[&>*]:self-stretch">
        <ResolutionRateChart compact />
        <ComplaintTrendChart compact tall />
      </div>

      {/* 50/50 — Upcoming SLA | Recent Resolutions */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:[&>*]:self-stretch">
        <UpcomingSLABreaches items={m.upcomingSla} />
        <RecentResolutions items={m.recentResolved} />
      </div>
    </div>
  );
}
