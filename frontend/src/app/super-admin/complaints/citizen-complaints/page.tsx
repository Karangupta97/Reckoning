"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Search, ChevronDown, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { SA_COMPLAINTS, priorityBadge, statusBadge, type SAPriority, type SAStatus } from "@/lib/super-admin-mock";

export default function CitizenComplaintsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [priorityF, setPriorityF] = useState("");
  const [statusF, setStatusF] = useState("");

  const filtered = SA_COMPLAINTS.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !q || c.id.toLowerCase().includes(q) || c.project.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    return matchQ && (!priorityF || c.priority === priorityF) && (!statusF || c.status === statusF);
  });

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <AlertTriangle size={20} className="text-amber-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Citizen Complaints</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">All complaints filed across infrastructure projects</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",       value: String(SA_COMPLAINTS.length),                                                   color: "text-cyan-400"    },
          { label: "Open",        value: String(SA_COMPLAINTS.filter(c => c.status === "Open").length),                   color: "text-red-400"     },
          { label: "Escalated",   value: String(SA_COMPLAINTS.filter(c => c.status === "Escalated").length),             color: "text-orange-400"  },
          { label: "Resolved",    value: String(SA_COMPLAINTS.filter(c => c.status === "Resolved" || c.status === "Closed").length), color: "text-emerald-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 min-w-[180px] max-w-sm"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, project, state, category…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full" />
            </div>
            {([
              { value: priorityF, setter: setPriorityF, options: ["High","Medium","Low"],                          placeholder: "All Priorities" },
              { value: statusF,   setter: setStatusF,   options: ["Open","Escalated","Under Review","Resolved"],   placeholder: "All Statuses"   },
            ] as const).map((f, i) => (
              <div key={i} className="relative">
                <select value={f.value} onChange={(e) => (f.setter as (v: string) => void)(e.target.value)}
                  className="h-9 appearance-none rounded-lg border pl-3 pr-7 text-xs outline-none"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
                  <option value="">{f.placeholder}</option>
                  {f.options.map((o) => <option key={o} value={o} style={{ background: "var(--color-card)" }}>{o}</option>)}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              </div>
            ))}
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>{["ID","Project","State","Category","Priority","Status","Action"].map((h) => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="dashboard-table-row cursor-pointer hover:bg-[var(--color-surface)]"
                    onClick={() => router.push(`/super-admin/complaints/citizen-complaints/${c.id}`)}>
                    <td className="dashboard-table-td">
                      <span className="dashboard-table-td-mono text-xs flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-[var(--color-danger)]" />{c.id}
                      </span>
                    </td>
                    <td className="dashboard-table-td dashboard-table-td-primary text-sm max-w-[14rem] truncate">{c.project}</td>
                    <td className="dashboard-table-td text-xs whitespace-nowrap">{c.state}</td>
                    <td className="dashboard-table-td text-xs whitespace-nowrap">{c.category}</td>
                    <td className="dashboard-table-td"><span className={`dashboard-table-badge ${priorityBadge[c.priority]}`}>{c.priority}</span></td>
                    <td className="dashboard-table-td"><span className={`dashboard-table-badge ${statusBadge[c.status]}`}>{c.status}</span></td>
                    <td className="dashboard-table-td" onClick={(e) => e.stopPropagation()}>
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => router.push(`/super-admin/complaints/citizen-complaints/${c.id}`)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium"
                        style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: "#22d3ee" }}>
                        <Eye size={11} /> View
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">{filtered.length} of {SA_COMPLAINTS.length} complaints</span>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
