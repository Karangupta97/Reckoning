"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardCheck, AlertTriangle, Zap, Shield } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  APPROVAL_TABS,
  BUDGET_PRIORITY_CLS,
  BUDGET_STATUS_CLS,
  BUDGET_TYPE_CLS,
  type ApprovalQueueTab,
} from "@/components/super-admin-dashboard/budget-approval-ui";
import { formatBudgetAmount, useBudgetApprovalStore } from "@/store/budgetApprovalStore";

function filterByTab(tab: ApprovalQueueTab, requests: ReturnType<typeof useBudgetApprovalStore.getState>["requests"]) {
  switch (tab) {
    case "pending":
      return requests.filter((r) =>
        ["Pending Approval", "Clarification Requested", "Sent Back For Review", "Under Audit"].includes(r.status)
      );
    case "approved":
      return requests.filter((r) => r.status === "Approved");
    case "rejected":
      return requests.filter((r) => r.status === "Rejected");
    case "high-priority":
      return requests.filter((r) => r.priority === "Critical" || r.priority === "High");
    case "emergency":
      return requests.filter((r) => r.requestType === "Emergency");
    default:
      return requests;
  }
}

const TAB_PARAM: Record<string, ApprovalQueueTab> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  "high-priority": "high-priority",
  emergency: "emergency",
};

export default function ApprovalQueuePage() {
  const searchParams = useSearchParams();
  const initialTab = TAB_PARAM[searchParams.get("tab") ?? ""] ?? "pending";
  const requests = useBudgetApprovalStore((s) => s.requests);
  const [tab, setTab] = useState<ApprovalQueueTab>(initialTab);

  const filtered = useMemo(() => filterByTab(tab, requests), [tab, requests]);

  const stats = useMemo(
    () => ({
      pending: filterByTab("pending", requests).length,
      approved: filterByTab("approved", requests).length,
      rejected: filterByTab("rejected", requests).length,
      emergency: filterByTab("emergency", requests).length,
    }),
    [requests]
  );

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <ClipboardCheck size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Approval Queue</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Budget requests awaiting Super Admin review and governance decisions
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: "Pending", value: String(stats.pending), color: "text-amber-400", icon: AlertTriangle },
          { label: "Approved", value: String(stats.approved), color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Rejected", value: String(stats.rejected), color: "text-red-400", icon: Shield },
          { label: "Emergency", value: String(stats.emergency), color: "text-orange-400", icon: Zap },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <s.icon size={16} className={`mb-1 ${s.color}`} />
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {APPROVAL_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-transparent"
              }`}
            >
              {t.label}
              <span className="ml-1.5 opacity-60">({filterByTab(t.id, requests).length})</span>
            </button>
          ))}
        </div>

        <DashboardCard>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {["Request ID", "District", "Project", "Amount", "Type", "Priority", "Status", "Submitted"].map((h) => (
                    <th key={h} className="dashboard-table-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="dashboard-table-td text-center text-sm text-[var(--color-text-muted)] py-8">
                      No requests in this queue.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="dashboard-table-row"
                    >
                      <td className="dashboard-table-td dashboard-table-td-mono text-xs">
                        <Link
                          href={`/super-admin/governance/approvals/${r.id}`}
                          className="text-cyan-400 hover:underline font-semibold"
                        >
                          {r.id}
                        </Link>
                      </td>
                      <td className="dashboard-table-td text-sm">
                        <div className="font-medium text-[var(--color-text-primary)]">{r.district}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">{r.state}</div>
                      </td>
                      <td className="dashboard-table-td text-xs max-w-[200px] truncate" title={r.project}>
                        {r.project}
                      </td>
                      <td className="dashboard-table-td text-xs font-semibold whitespace-nowrap">
                        {formatBudgetAmount(r.approvedAmount ?? r.requestedAmount)}
                      </td>
                      <td className="dashboard-table-td">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${BUDGET_TYPE_CLS[r.requestType]}`}>
                          {r.requestType}
                        </span>
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
                      <td className="dashboard-table-td text-xs whitespace-nowrap">{r.submittedOn}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
