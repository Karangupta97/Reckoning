"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowRight, Shield } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { BUDGET_STATUS_CLS } from "@/components/super-admin-dashboard/budget-approval-ui";
import { formatBudgetAmount, useBudgetApprovalStore } from "@/store/budgetApprovalStore";

export default function AuditInsightsPage() {
  const requests = useBudgetApprovalStore((s) => s.requests);
  const underAudit = requests.filter((r) => r.status === "Under Audit");
  const flagged = requests.filter((r) => r.priority === "Critical" && r.status !== "Approved");

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-cyan-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Audit Insights</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Expenditure audit flags and budget requests under review</p>
          </div>
        </div>
        <Link
          href="/super-admin/governance/approvals?tab=high-priority"
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
          { label: "Under Audit", value: String(underAudit.length), color: "text-purple-400" },
          { label: "Critical Pending", value: String(flagged.length), color: "text-red-400" },
          { label: "Audit Events", value: String(requests.reduce((s, r) => s + r.auditTrail.length, 0)), color: "text-amber-400" },
          { label: "Risk Value", value: formatBudgetAmount(underAudit.reduce((s, r) => s + r.requestedAmount, 0)), color: "text-orange-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-purple-400" />
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Requests Under Audit</h2>
          </div>
          {underAudit.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No budget requests currently under audit.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {underAudit.map((r) => (
                <Link
                  key={r.id}
                  href={`/super-admin/governance/approvals/${r.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-cyan-500/5 transition-colors"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-semibold text-cyan-400">{r.id}</span>
                    <p className="text-xs text-[var(--color-text-primary)] truncate">{r.project}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{r.district}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${BUDGET_STATUS_CLS[r.status]}`}>
                      {r.status}
                    </span>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-1">{formatBudgetAmount(r.requestedAmount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DashboardCard>
      </motion.div>
    </div>
  );
}
