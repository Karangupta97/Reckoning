"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

const REVIEWS = [
  { id: "CR-001", entity: "L&T Infrastructure",    type: "Contractor",     status: "Passed",  dueDate: "30 Jun 2026", reviewer: "Audit Cell A" },
  { id: "CR-002", entity: "Delhi District Admin",   type: "District Admin", status: "Pending", dueDate: "15 Jul 2026", reviewer: "Compliance Dept" },
  { id: "CR-003", entity: "NCC Limited",            type: "Contractor",     status: "Failed",  dueDate: "01 Jun 2026", reviewer: "Audit Cell B" },
  { id: "CR-004", entity: "Maharashtra Escalations",type: "Escalation Log", status: "Passed",  dueDate: "28 May 2026", reviewer: "Audit Cell A" },
  { id: "CR-005", entity: "PMGSY Bihar",            type: "Project",        status: "Pending", dueDate: "20 Jul 2026", reviewer: "Compliance Dept" },
  { id: "CR-006", entity: "IRB Infrastructure",     type: "Contractor",     status: "Passed",  dueDate: "10 Jun 2026", reviewer: "Audit Cell C" },
];

const statusBadge: Record<string, string> = {
  Passed:  "dashboard-table-badge-status-resolved",
  Pending: "dashboard-table-badge-status-escalated",
  Failed:  "dashboard-table-badge-status-open",
};
const statusIcon: Record<string, typeof CheckCircle2> = {
  Passed:  CheckCircle2,
  Pending: Clock,
  Failed:  AlertTriangle,
};

export default function ComplianceReviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Compliance Review</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Periodic compliance audit status for entities across the platform</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Reviews",   value: String(REVIEWS.length),                                     color: "text-cyan-400"    },
          { label: "Passed",          value: String(REVIEWS.filter(r => r.status === "Passed").length),   color: "text-emerald-400" },
          { label: "Pending",         value: String(REVIEWS.filter(r => r.status === "Pending").length),  color: "text-amber-400"   },
          { label: "Failed",          value: String(REVIEWS.filter(r => r.status === "Failed").length),   color: "text-red-400"     },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>{["Review ID","Entity","Type","Status","Due Date","Reviewer"].map(h => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {REVIEWS.map((r, i) => {
                  const Icon = statusIcon[r.status];
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="dashboard-table-row">
                      <td className="dashboard-table-td dashboard-table-td-mono text-xs">{r.id}</td>
                      <td className="dashboard-table-td dashboard-table-td-primary text-sm">{r.entity}</td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap">{r.type}</td>
                      <td className="dashboard-table-td">
                        <span className={`dashboard-table-badge flex items-center gap-1 w-fit ${statusBadge[r.status]}`}>
                          <Icon size={11} />{r.status}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap">{r.dueDate}</td>
                      <td className="dashboard-table-td text-xs">{r.reviewer}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
