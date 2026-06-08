"use client";

import { motion } from "framer-motion";
import { FileText, Download, Calendar, BarChart3, TrendingUp, Shield } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

const REPORTS = [
  { id: "RPT-001", title: "Q2 FY2026 Expenditure Audit",        type: "Expenditure",    generated: "01 Jun 2026", size: "2.4 MB", status: "Ready"   },
  { id: "RPT-002", title: "National Road Quality Index — May",   type: "Infrastructure", generated: "31 May 2026", size: "4.1 MB", status: "Ready"   },
  { id: "RPT-003", title: "Contractor Risk Assessment Report",   type: "Contractors",    generated: "28 May 2026", size: "1.8 MB", status: "Ready"   },
  { id: "RPT-004", title: "Complaint Resolution SLA Report",     type: "Complaints",     generated: "25 May 2026", size: "3.2 MB", status: "Ready"   },
  { id: "RPT-005", title: "AI Anomaly Detection — Monthly",      type: "AI Alerts",      generated: "20 May 2026", size: "1.1 MB", status: "Ready"   },
  { id: "RPT-006", title: "Q3 FY2026 Expenditure Audit",         type: "Expenditure",    generated: "—",           size: "—",       status: "Pending" },
];

const typeIcon: Record<string, typeof FileText> = {
  Expenditure:    BarChart3,
  Infrastructure: TrendingUp,
  Contractors:    Shield,
  Complaints:     FileText,
  "AI Alerts":    FileText,
};
const typeColor: Record<string, string> = {
  Expenditure:    "text-cyan-400",
  Infrastructure: "text-emerald-400",
  Contractors:    "text-orange-400",
  Complaints:     "text-amber-400",
  "AI Alerts":    "text-red-400",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <FileText size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Reports</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Generated reports across expenditure, infrastructure, and compliance</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Reports",   value: String(REPORTS.length),                                      color: "text-cyan-400"    },
          { label: "Ready",           value: String(REPORTS.filter(r => r.status === "Ready").length),    color: "text-emerald-400" },
          { label: "Pending",         value: String(REPORTS.filter(r => r.status === "Pending").length),  color: "text-amber-400"   },
          { label: "This Month",      value: "4",                                                          color: "text-teal-400"    },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">All Reports</h3>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-secondary flex items-center gap-1.5 !h-9 !px-3 !text-xs">
              <Calendar size={13} /> Schedule Report
            </motion.button>
          </div>
          <div className="flex flex-col gap-2">
            {REPORTS.map((r, i) => {
              const Icon = typeIcon[r.type] ?? FileText;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className={typeColor[r.type] ?? "text-cyan-400"} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{r.title}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{r.id} · {r.type} · {r.generated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-[var(--color-text-muted)]">{r.size}</span>
                    <span className={`dashboard-table-badge ${r.status === "Ready" ? "dashboard-table-badge-status-resolved" : "dashboard-table-badge-status-escalated"}`}>
                      {r.status}
                    </span>
                    {r.status === "Ready" && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium transition-colors"
                        style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: "var(--color-cyan, #22d3ee)" }}>
                        <Download size={11} /> Download
                      </motion.button>
                    )}
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
