"use client";

import { motion } from "framer-motion";
import { IndianRupee, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useBudgetApprovalStore, formatBudgetAmount } from "@/store/budgetApprovalStore";

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  "Pending Approval":        { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  "Approved":                { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  "Rejected":                { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
  "Clarification Requested": { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  "Under Audit":             { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
  "Sent Back For Review":    { bg: "rgba(34,211,238,0.12)", color: "#22d3ee" },
};

export default function SubDistrictBudgetStatusPage() {
  const requests = useBudgetApprovalStore((s) => s.requests);

  return (
    <div className="flex flex-col gap-3">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <IndianRupee size={20} className="text-amber-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Budget Request Status</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Read-only view of district budget request progress</p>
        </div>
      </motion.div>

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Requests",  value: String(requests.length),                                               color: "text-cyan-400"    },
          { label: "Approved",        value: String(requests.filter(r => r.status === "Approved").length),           color: "text-emerald-400" },
          { label: "Pending",         value: String(requests.filter(r => r.status === "Pending Approval").length),   color: "text-amber-400"   },
          { label: "Clarification",   value: String(requests.filter(r => r.status === "Clarification Requested").length), color: "text-purple-400"  },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-3 px-2 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col">
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {["Budget ID", "Project", "Amount", "Approved", "Released", "Linked ESC", "District", "Status", "Submitted"].map((h) => (
                    <th key={h} className="dashboard-table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const badge = STATUS_BADGE[r.status] ?? { bg: "rgba(100,116,139,0.12)", color: "#64748b" };
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="dashboard-table-row">
                      <td className="dashboard-table-td">
                        <span className="font-mono text-xs font-semibold" style={{ color: "var(--sda-amber)" }}>{r.id}</span>
                      </td>
                      <td className="dashboard-table-td text-xs font-medium text-[var(--color-text-primary)] max-w-[180px] truncate">{r.project}</td>
                      <td className="dashboard-table-td text-xs font-bold tabular-nums" style={{ color: "var(--sda-amber)" }}>
                        {formatBudgetAmount(r.requestedAmount)}
                      </td>
                      <td className="dashboard-table-td text-xs tabular-nums">
                        {r.approvedAmount ? (
                          <span className="font-bold text-emerald-400">{formatBudgetAmount(r.approvedAmount)}</span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td className="dashboard-table-td text-xs tabular-nums">
                        {r.releasedAmount ? (
                          <div>
                            <span className="font-bold text-cyan-400">{formatBudgetAmount(r.releasedAmount)}</span>
                            {r.releaseStatus && (
                              <span className="ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: r.releaseStatus === "Fully Released" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                                  color: r.releaseStatus === "Fully Released" ? "#10b981" : "#f59e0b",
                                }}>
                                {r.releaseStatus}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td className="dashboard-table-td">
                        {r.linkedEscalationIds && r.linkedEscalationIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {r.linkedEscalationIds.map((escId) => (
                              <span key={escId} className="font-mono text-[9px] font-semibold text-amber-400">{escId}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[9px] text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{r.district}</td>
                      <td className="dashboard-table-td">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: badge.bg, color: badge.color }}>
                          {r.status}
                        </span>
                      </td>
                      <td className="dashboard-table-td text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">{r.submittedOn}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">{requests.length} budget requests · Read-only view</span>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Timeline — latest activity across all requests */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Recent Budget Activity</h3>
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {requests.flatMap(r => r.activityLog.slice(0, 2).map(a => ({ ...a, budgetId: r.id, project: r.project })))
              .sort((a, b) => b.time.localeCompare(a.time))
              .slice(0, 8)
              .map((a, i) => (
                <div key={`${a.budgetId}-${i}`} className="flex items-start gap-2 py-1.5 border-b border-[var(--color-border)] last:border-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(245,158,11,0.1)" }}>
                    <IndianRupee size={11} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--sda-amber)" }}>{a.budgetId}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{a.time}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">{a.action}</p>
                  </div>
                </div>
              ))}
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
