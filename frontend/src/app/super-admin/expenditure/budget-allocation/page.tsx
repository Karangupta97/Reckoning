"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  BUDGET_PRIORITY_CLS,
  BUDGET_STATUS_CLS,
} from "@/components/super-admin-dashboard/budget-approval-ui";
import { formatBudgetAmount, useBudgetApprovalStore } from "@/store/budgetApprovalStore";

export default function BudgetAllocationPage() {
  const requests = useBudgetApprovalStore((s) => s.requests);

  const totalRequested = requests.reduce((s, r) => s + r.requestedAmount, 0);
  const totalApproved = requests
    .filter((r) => r.status === "Approved")
    .reduce((s, r) => s + (r.approvedAmount ?? r.requestedAmount), 0);
  const pending = requests.filter((r) =>
    ["Pending Approval", "Clarification Requested", "Sent Back For Review", "Under Audit"].includes(r.status)
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-cyan-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Budget Allocation</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">State-wise and project-wise budget distribution</p>
          </div>
        </div>
        <Link
          href="/super-admin/governance/approvals"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-colors shrink-0"
          style={{ borderColor: "rgba(6,182,212,0.3)" }}
        >
          Approval Queue <ArrowRight size={13} />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: "Total Requested", value: formatBudgetAmount(totalRequested), color: "text-cyan-400" },
          { label: "Approved", value: formatBudgetAmount(totalApproved), color: "text-emerald-400" },
          { label: "Pending Review", value: String(pending), color: "text-amber-400" },
          { label: "Active Requests", value: String(requests.length), color: "text-slate-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard>
          <div className="flex items-center justify-between px-1 pb-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Budget Requests by District</h2>
            <span className="text-[10px] text-[var(--color-text-muted)]">Click ID to review</span>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {["Request ID", "District", "Project", "Amount", "Priority", "Status"].map((h) => (
                    <th key={h} className="dashboard-table-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="dashboard-table-row"
                  >
                    <td className="dashboard-table-td dashboard-table-td-mono text-xs">
                      <Link href={`/super-admin/governance/approvals/${r.id}`} className="text-cyan-400 hover:underline font-semibold">
                        {r.id}
                      </Link>
                    </td>
                    <td className="dashboard-table-td text-sm">{r.district}</td>
                    <td className="dashboard-table-td text-xs max-w-[180px] truncate" title={r.project}>
                      {r.project}
                    </td>
                    <td className="dashboard-table-td text-xs font-semibold whitespace-nowrap">
                      {formatBudgetAmount(r.approvedAmount ?? r.requestedAmount)}
                    </td>
                    <td className="dashboard-table-td">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${BUDGET_PRIORITY_CLS[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="dashboard-table-td">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${BUDGET_STATUS_CLS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
