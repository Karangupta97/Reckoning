"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Search, ChevronDown, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useEscalationStore } from "@/store/escalationStore";
import type { EscalationPriority, EscalationStatus, EscalationSLAStatus } from "@/store/escalationStore";

const priorityBadge: Record<EscalationPriority, string> = {
  Critical: "dashboard-table-badge-status-open",
  High:     "dashboard-table-badge-status-escalated",
  Medium:   "dashboard-table-badge-status-review",
  Low:      "dashboard-table-badge-status-resolved",
};
const statusBadge: Record<EscalationStatus, string> = {
  "Pending Review": "dashboard-table-badge-status-escalated",
  "Assigned":       "dashboard-table-badge-status-review",
  "Investigating":  "dashboard-table-badge-priority-medium",
  "Resolved":       "dashboard-table-badge-status-resolved",
  "Closed":         "dashboard-table-badge-status-resolved",
};
const slaDot: Record<EscalationSLAStatus, string> = {
  Breached:   "bg-red-400 animate-pulse",
  "At Risk":  "bg-amber-400",
  "On Track": "bg-emerald-400",
};

export default function EscalatedCasesPage() {
  const router = useRouter();
  const escalations = useEscalationStore((s) => s.escalations);
  const [search,     setSearch]    = useState("");
  const [priorityF,  setPriorityF] = useState("");
  const [statusF,    setStatusF]   = useState("");
  const [slaF,       setSlaF]      = useState("");

  const filtered = escalations
    .filter((e, idx, arr) => arr.findIndex((x) => x.id === e.id) === idx) // deduplicate
    .filter((e) => {
      const q = search.toLowerCase();
      const matchQ = !q || e.id.toLowerCase().includes(q) || e.title.toLowerCase().includes(q) || e.subDistrict.toLowerCase().includes(q);
      return matchQ
        && (!priorityF || e.priority === priorityF)
        && (!statusF   || e.status   === statusF)
        && (!slaF      || e.slaStatus === slaF);
    });

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <ShieldAlert size={20} className="text-orange-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Escalated Cases</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">All escalations raised from district and sub-district admins</p>
        </div>
      </motion.div>

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",          value: String(escalations.length),                                                     color: "text-cyan-400"    },
          { label: "Pending Review", value: String(escalations.filter(e => e.status === "Pending Review").length),           color: "text-amber-400"   },
          { label: "Breached SLA",   value: String(escalations.filter(e => e.slaStatus === "Breached").length),              color: "text-red-400"     },
          { label: "Resolved",       value: String(escalations.filter(e => e.status === "Resolved" || e.status === "Closed").length), color: "text-emerald-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 min-w-[180px] max-w-sm"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ID, title, sub-district…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full" />
            </div>
            {([
              { value: priorityF, setter: setPriorityF, options: ["Critical","High","Medium","Low"],                         placeholder: "All Priorities" },
              { value: statusF,   setter: setStatusF,   options: ["Pending Review","Assigned","Investigating","Resolved"],   placeholder: "All Statuses"   },
              { value: slaF,      setter: setSlaF,       options: ["Breached","At Risk","On Track"],                         placeholder: "All SLA"        },
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

          {/* Table */}
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>{["ID","Title","Sub-District","Category","Priority","SLA","Status","Days Open","Action"].map(h => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="dashboard-table-row cursor-pointer hover:bg-[var(--color-surface)]"
                    onClick={() => router.push(`/super-admin/complaints/escalated-cases/${e.id}`)}>
                    <td className="dashboard-table-td">
                      <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: "var(--color-amber, #f59e0b)" }}>
                        <ShieldAlert size={12} className="text-orange-400" />{e.id}
                      </span>
                    </td>
                    <td className="dashboard-table-td dashboard-table-td-primary text-sm max-w-[12rem] truncate">{e.title}</td>
                    <td className="dashboard-table-td text-xs whitespace-nowrap">{e.subDistrict}</td>
                    <td className="dashboard-table-td text-xs whitespace-nowrap">{e.category}</td>
                    <td className="dashboard-table-td"><span className={`dashboard-table-badge ${priorityBadge[e.priority]}`}>{e.priority}</span></td>
                    <td className="dashboard-table-td">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${slaDot[e.slaStatus]}`} />
                        {e.slaLabel}
                      </span>
                    </td>
                    <td className="dashboard-table-td"><span className={`dashboard-table-badge ${statusBadge[e.status]}`}>{e.status}</span></td>
                    <td className="dashboard-table-td text-xs tabular-nums text-center">{e.daysOpen}d</td>
                    <td className="dashboard-table-td" onClick={ev => ev.stopPropagation()}>
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => router.push(`/super-admin/complaints/escalated-cases/${e.id}`)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium"
                        style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
                        <Eye size={11} /> View
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">{filtered.length} of {escalations.length} escalations</span>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
