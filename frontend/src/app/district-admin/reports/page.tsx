"use client";

import { motion } from "framer-motion";
import { FileText, Download, Printer, Filter, BarChart3, ShieldAlert, Camera, IndianRupee, Landmark, Clock, CheckCircle2 } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  exportDistrictComplaintSummary,
  exportDistrictEscalationSummary,
  exportDistrictEvidenceSummary,
  exportDistrictBudgetSummary,
  exportDistrictGovernanceSummary,
  exportDistrictSLAMetrics,
  exportDistrictResolutionMetrics,
} from "@/lib/report-generator";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useEvidenceStore } from "@/store/evidenceStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";

interface ReportDef {
  id: string;
  title: string;
  type: string;
  icon: typeof FileText;
  color: string;
  description: string;
  exportFn: () => void;
  count: number;
}

export default function ReportsPage() {
  const complaints = useComplaintStore((s) => s.complaints);
  const escalations = useEscalationStore((s) => s.escalations);
  const evidence = useEvidenceStore((s) => s.records);
  const budgets = useBudgetApprovalStore((s) => s.requests);
  const governance = useGovernanceRequestStore((s) => s.requests);

  const reports: ReportDef[] = [
    {
      id: "RPT-CMP",
      title: "Complaint Summary Report",
      type: "Complaints",
      icon: FileText,
      color: "#14b8a6",
      description: `All ${complaints.length} complaints with status, priority, SLA, and officer assignments`,
      exportFn: exportDistrictComplaintSummary,
      count: complaints.length,
    },
    {
      id: "RPT-ESC",
      title: "Escalation Summary Report",
      type: "Escalations",
      icon: ShieldAlert,
      color: "#f97316",
      description: `All ${escalations.length} escalations with tier, assignment, and SLA tracking`,
      exportFn: exportDistrictEscalationSummary,
      count: escalations.length,
    },
    {
      id: "RPT-EV",
      title: "Evidence Summary Report",
      type: "Evidence",
      icon: Camera,
      color: "#8b5cf6",
      description: `All ${evidence.length} evidence records with review status and file counts`,
      exportFn: exportDistrictEvidenceSummary,
      count: evidence.length,
    },
    {
      id: "RPT-BUD",
      title: "Budget Summary Report",
      type: "Budget",
      icon: IndianRupee,
      color: "#f59e0b",
      description: `All ${budgets.length} budget requests with amounts, approvals, and release status`,
      exportFn: exportDistrictBudgetSummary,
      count: budgets.length,
    },
    {
      id: "RPT-GOV",
      title: "Governance Summary Report",
      type: "Governance",
      icon: Landmark,
      color: "#3b82f6",
      description: `All ${governance.length} governance requests with approval status`,
      exportFn: exportDistrictGovernanceSummary,
      count: governance.length,
    },
    {
      id: "RPT-SLA",
      title: "SLA Compliance Metrics",
      type: "SLA",
      icon: Clock,
      color: "#ef4444",
      description: "SLA status breakdown for complaints and escalations",
      exportFn: exportDistrictSLAMetrics,
      count: complaints.filter((c) => c.slaStatus === "Breached").length,
    },
    {
      id: "RPT-RES",
      title: "Resolution Metrics Report",
      type: "Resolution",
      icon: CheckCircle2,
      color: "#22c55e",
      description: "Resolution rate, escalation rate, and rejection statistics",
      exportFn: exportDistrictResolutionMetrics,
      count: complaints.filter((c) => c.status === "Resolved").length,
    },
  ];

  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const resRate = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-teal-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Reports & Exports</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">Generate and download live data reports from all district operations</p>
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Reports Available", value: String(reports.length), color: "text-teal-400" },
          { label: "Total Records", value: String(complaints.length + escalations.length + evidence.length), color: "text-cyan-400" },
          { label: "Resolution Rate", value: `${resRate}%`, color: "text-emerald-400" },
          { label: "Budget Requests", value: String(budgets.length), color: "text-amber-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Report cards */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Available Reports</h3>
            <span className="text-[10px] text-[var(--color-text-muted)]">All reports use live store data</span>
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
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">{r.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold tabular-nums" style={{ color: r.color }}>{r.count}</span>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={r.exportFn}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium transition-colors"
                      style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
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
