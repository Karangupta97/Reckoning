"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import ExpenditureChart from "@/components/super-admin-dashboard/expenditure-chart";
import { formatBudgetAmount, useBudgetApprovalStore } from "@/store/budgetApprovalStore";

export default function SpendingTrendsPage() {
  const requests = useBudgetApprovalStore((s) => s.requests);
  const approvedTotal = requests
    .filter((r) => r.status === "Approved")
    .reduce((s, r) => s + (r.approvedAmount ?? r.requestedAmount), 0);
  const emergencyTotal = requests
    .filter((r) => r.requestType === "Emergency")
    .reduce((s, r) => s + r.requestedAmount, 0);

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-cyan-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Spending Trends</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Quarter-on-quarter expenditure trend analysis</p>
          </div>
        </div>
        <Link
          href="/super-admin/governance/approvals"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-colors shrink-0"
          style={{ borderColor: "rgba(6,182,212,0.3)" }}
        >
          View Approvals <ArrowRight size={13} />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: "Approved (FY)", value: formatBudgetAmount(approvedTotal), color: "text-emerald-400" },
          { label: "Emergency Requests", value: formatBudgetAmount(emergencyTotal), color: "text-red-400" },
          { label: "Active Requests", value: String(requests.length), color: "text-cyan-400" },
          { label: "Districts", value: String(new Set(requests.map((r) => r.district)).size), color: "text-amber-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ExpenditureChart />
      </motion.div>
    </div>
  );
}
