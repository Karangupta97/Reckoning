"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { SA_COMPLAINTS, priorityBadge, statusBadge } from "@/lib/super-admin-mock";
import { useEscalationStore } from "@/store/escalationStore";
import { useAuthStore } from "@/stores/authStore";
import { shouldUseMock } from "@/lib/useMock";

/* ─── Merge complaints + escalations for a full resolution view ─ */
function useResolutionData(complaintsSource: typeof SA_COMPLAINTS) {
  const escalations = useEscalationStore((s) => s.escalations);

  const complaintRows = complaintsSource.map((c) => ({
    id: c.id,
    title: c.title,
    type: "Complaint" as const,
    state: c.state,
    category: c.category,
    priority: c.priority,
    status: c.status,
    slaStatus: c.slaStatus,
    reportedOn: c.reportedOn,
    assignedTo: c.assignedTo,
  }));

  const escalationRows = escalations.map((e) => ({
    id: e.id,
    title: e.title,
    type: "Escalation" as const,
    state: e.subDistrict,
    category: e.category,
    priority: e.priority as "High" | "Medium" | "Low",
    status: (e.status === "Resolved" || e.status === "Closed" ? "Resolved"
      : e.status === "Investigating" ? "Under Review"
      : e.status === "Pending Review" || e.status === "Assigned" ? "Open"
      : "Open") as "Open" | "Escalated" | "Under Review" | "Resolved" | "Closed",
    slaStatus: e.slaStatus as "On Track" | "At Risk" | "Breached",
    reportedOn: e.escalatedOn,
    assignedTo: e.assignedTo,
  }));

  return [...complaintRows, ...escalationRows];
}

const slaColors = {
  Breached:   { dot: "bg-red-400 animate-pulse",  text: "text-red-400"     },
  "At Risk":  { dot: "bg-amber-400",              text: "text-amber-400"   },
  "On Track": { dot: "bg-emerald-400",            text: "text-emerald-400" },
} as const;

export default function ResolutionTrackerPage() {
  const router = useRouter();
  const email = useAuthStore((state) => state.user?.email);
  const complaints = shouldUseMock(email) ? SA_COMPLAINTS : [];
  const rows = useResolutionData(complaints);

  const [search,     setSearch]    = useState("");
  const [typeF,      setTypeF]     = useState("");
  const [statusF,    setStatusF]   = useState("");
  const [slaF,       setSlaF]      = useState("");

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchQ = !q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.state.toLowerCase().includes(q);
    return matchQ
      && (!typeF   || r.type     === typeF)
      && (!statusF || r.status   === statusF)
      && (!slaF    || r.slaStatus === slaF);
  });

  const resolved   = rows.filter(r => r.status === "Resolved" || r.status === "Closed").length;
  const breached   = rows.filter(r => r.slaStatus === "Breached").length;
  const atRisk     = rows.filter(r => r.slaStatus === "At Risk").length;
  const onTime     = rows.length > 0 ? Math.round(((rows.length - breached) / rows.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Resolution Tracker</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Track resolution status and SLA compliance across all complaints and escalations</p>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Records",  value: String(rows.length), color: "text-cyan-400",    icon: TrendingUp    },
          { label: "Resolved",       value: String(resolved),    color: "text-emerald-400", icon: CheckCircle2  },
          { label: "SLA Breached",   value: String(breached),    color: "text-red-400",     icon: AlertTriangle },
          { label: "On Time %",      value: `${onTime}%`,        color: "text-amber-400",   icon: Clock         },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* SLA overview bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DashboardCard className="px-5 py-4">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">SLA Distribution</p>
          <div className="flex h-3 w-full overflow-hidden rounded-full gap-0.5">
            {[
              { count: rows.filter(r => r.slaStatus === "On Track").length, color: "bg-emerald-400" },
              { count: rows.filter(r => r.slaStatus === "At Risk").length,  color: "bg-amber-400"   },
              { count: breached,                                             color: "bg-red-400"     },
            ].map((s, i) => (
              <div key={i} className={`h-full transition-all ${s.color}`}
                style={{ width: `${rows.length ? (s.count / rows.length) * 100 : 0}%` }} />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {[
              { label: "On Track", count: rows.filter(r => r.slaStatus === "On Track").length, color: "bg-emerald-400" },
              { label: "At Risk",  count: atRisk,   color: "bg-amber-400"   },
              { label: "Breached", count: breached, color: "bg-red-400"     },
            ].map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                {s.label}: <strong className="text-[var(--color-text-secondary)]">{s.count}</strong>
              </span>
            ))}
          </div>
        </DashboardCard>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 min-w-[180px] max-w-sm"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ID, title, state…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full" />
            </div>
            {([
              { value: typeF,   setter: setTypeF,   options: ["Complaint","Escalation"],                          placeholder: "All Types"    },
              { value: statusF, setter: setStatusF, options: ["Open","Under Review","Resolved","Closed"],          placeholder: "All Statuses" },
              { value: slaF,    setter: setSlaF,     options: ["On Track","At Risk","Breached"],                   placeholder: "All SLA"      },
            ] as const).map((f, i) => (
              <div key={i} className="relative">
                <select value={f.value} onChange={e => (f.setter as (v: string) => void)(e.target.value)}
                  className="h-9 appearance-none rounded-lg border pl-3 pr-7 text-xs outline-none"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
                  <option value="">{f.placeholder}</option>
                  {f.options.map(o => <option key={o} value={o} style={{ background: "var(--color-card)" }}>{o}</option>)}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              </div>
            ))}
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>{["ID","Title","Type","State / Sub-District","Category","Priority","SLA","Status"].map(h => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const sla = slaColors[r.slaStatus];
                  const href = r.type === "Complaint"
                    ? `/super-admin/complaints/citizen-complaints/${r.id}`
                    : `/super-admin/complaints/escalated-cases/${r.id}`;
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                      className="dashboard-table-row cursor-pointer hover:bg-[var(--color-surface)]"
                      onClick={() => router.push(href)}>
                      <td className="dashboard-table-td dashboard-table-td-mono text-xs">{r.id}</td>
                      <td className="dashboard-table-td dashboard-table-td-primary text-sm max-w-[12rem] truncate">{r.title}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge text-[10px] ${r.type === "Complaint" ? "dashboard-table-badge-priority-medium" : "dashboard-table-badge-status-escalated"}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap">{r.state}</td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap">{r.category}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge ${priorityBadge[r.priority]}`}>{r.priority}</span>
                      </td>
                      <td className="dashboard-table-td">
                        <span className={`flex items-center gap-1.5 text-xs ${sla.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sla.dot}`} />
                          {r.slaStatus}
                        </span>
                      </td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge ${statusBadge[r.status]}`}>{r.status}</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">{filtered.length} of {rows.length} records</span>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
