"use client";

import { motion } from "framer-motion";
import { FileText, Download, BarChart3, ShieldAlert, Camera, IndianRupee, Landmark, Shield, Printer } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  exportSuperAdminExecutiveReport,
  exportDistrictComplaintSummary,
  exportDistrictEscalationSummary,
  exportDistrictEvidenceSummary,
  exportDistrictBudgetSummary,
  exportDistrictGovernanceSummary,
  exportAuditLog,
  printReport,
} from "@/lib/report-generator";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";
import { useAuditLogStore } from "@/store/auditLogStore";
import { useSuperAdminAnalyticsMetrics } from "@/hooks/use-analytics-metrics";

export default function SuperAdminReportsPage() {
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const evidence = useEvidenceStore((s) => s.records);
  const budgets = useBudgetApprovalStore((s) => s.requests);
  const governance = useGovernanceRequestStore((s) => s.requests);
  const auditEntries = useAuditLogStore((s) => s.entries);
  const metrics = useSuperAdminAnalyticsMetrics();

  const reports = [
    { id: "SA-EXEC", title: "Governance Health Report", type: "Executive", icon: BarChart3, color: "#22d3ee", desc: "Total complaints, escalations, budgets, funds, resolution rate, SLA", exportFn: exportSuperAdminExecutiveReport, count: complaints.length },
    { id: "SA-CMP", title: "All Complaints Export", type: "Complaints", icon: FileText, color: "#14b8a6", desc: `${complaints.length} complaints with full metadata`, exportFn: exportDistrictComplaintSummary, count: complaints.length },
    { id: "SA-ESC", title: "All Escalations Export", type: "Escalations", icon: ShieldAlert, color: "#f97316", desc: `${escalations.length} escalations across all tiers`, exportFn: exportDistrictEscalationSummary, count: escalations.length },
    { id: "SA-EV", title: "Evidence Records Export", type: "Evidence", icon: Camera, color: "#8b5cf6", desc: `${evidence.length} evidence submissions with review status`, exportFn: exportDistrictEvidenceSummary, count: evidence.length },
    { id: "SA-BUD", title: "Budget Requests Export", type: "Budget", icon: IndianRupee, color: "#f59e0b", desc: `${budgets.length} budget requests with release tracking`, exportFn: exportDistrictBudgetSummary, count: budgets.length },
    { id: "SA-GOV", title: "Governance Requests Export", type: "Governance", icon: Landmark, color: "#3b82f6", desc: `${governance.length} governance requests`, exportFn: exportDistrictGovernanceSummary, count: governance.length },
    { id: "SA-AUDIT", title: "Full Audit Log Export", type: "Audit", icon: Shield, color: "#ef4444", desc: `${auditEntries.length} audit entries — all actions`, exportFn: () => exportAuditLog(), count: auditEntries.length },
  ];

  const handlePrintExecutive = () => {
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const resRate = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;
    const releasedFunds = budgets.reduce((s, b) => s + (b.releasedAmount ?? 0), 0);

    printReport("Governance Health Report — Executive Summary", [
      {
        heading: "System Overview",
        rows: [
          { label: "Total Complaints", value: String(complaints.length) },
          { label: "Active Escalations", value: String(metrics.activeEscalations) },
          { label: "Pending Evidence Reviews", value: String(metrics.pendingEvidence) },
          { label: "Pending Budget Requests", value: String(metrics.pendingBudgets) },
          { label: "Released Funds", value: `₹${releasedFunds.toFixed(1)} Cr` },
          { label: "Governance Requests", value: String(governance.length) },
          { label: "Resolution Rate", value: `${resRate}%` },
          { label: "SLA Breach Count", value: String(metrics.slaBreachCount) },
        ],
      },
      {
        heading: "Budget Utilization",
        rows: metrics.fundUtilization.map((f) => ({
          label: f.district,
          value: `Requested: ₹${f.requested.toFixed(1)} Cr | Approved: ₹${f.approved.toFixed(1)} Cr | Released: ₹${f.released.toFixed(1)} Cr`,
        })),
      },
      {
        heading: "Executive Insights",
        rows: metrics.insights.map((i) => ({
          label: i.label,
          value: i.value,
        })),
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-cyan-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Reports & Exports</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Generate governance reports and audit exports from live system data</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handlePrintExecutive}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium"
          style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: "#22d3ee" }}>
          <Printer size={14} /> Print Executive Report
        </motion.button>
      </motion.div>

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Reports", value: String(reports.length), color: "text-cyan-400" },
          { label: "Audit Entries", value: String(auditEntries.length), color: "text-emerald-400" },
          { label: "Resolution Rate", value: `${metrics.resolutionRate}%`, color: "text-teal-400" },
          { label: "Funds Released", value: `₹${metrics.releasedFunds.toFixed(1)} Cr`, color: "text-amber-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Reports list */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Available Exports</h3>
            <span className="text-[10px] text-[var(--color-text-muted)]">All reports generated from live store data</span>
          </div>
          <div className="flex flex-col gap-2">
            {reports.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.03 }}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${r.color}15`, color: r.color }}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{r.title}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold tabular-nums" style={{ color: r.color }}>{r.count}</span>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={r.exportFn}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium transition-colors"
                      style={{ borderColor: `${r.color}40`, background: `${r.color}12`, color: r.color }}>
                      <Download size={11} /> CSV
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
