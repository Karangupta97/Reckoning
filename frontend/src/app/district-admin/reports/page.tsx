"use client";

import { motion } from "framer-motion";
import { FileText, Download, Filter } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

const REPORTS = [
  { id: "RPT-001", title: "Monthly District Performance Report", date: "01 Jun 2026", type: "Performance", size: "1.2 MB", status: "Ready" },
  { id: "RPT-002", title: "Escalation Summary — May 2026", date: "31 May 2026", type: "Escalations", size: "840 KB", status: "Ready" },
  { id: "RPT-003", title: "SLA Compliance Report — Q1 2026", date: "15 Apr 2026", type: "SLA", size: "2.1 MB", status: "Ready" },
  { id: "RPT-004", title: "Sub-District Officer Activity Log", date: "28 May 2026", type: "Activity", size: "560 KB", status: "Ready" },
  { id: "RPT-005", title: "Citizen Complaint Analysis — June 2026", date: "04 Jun 2026", type: "Complaints", size: "Processing…", status: "Generating" },
];

const statusBadge: Record<string, string> = {
  Ready: "dashboard-table-badge-status-resolved",
  Generating: "dashboard-table-badge-status-escalated",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-teal-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Reports</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">District operational reports and exports</p>
          </div>
        </div>
        <button type="button" className="da-btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Filter size={14} />
          Generate Report
        </button>
      </motion.div>

      <DashboardCard
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-5"
      >
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th className="dashboard-table-th">Report ID</th>
                <th className="dashboard-table-th">Title</th>
                <th className="dashboard-table-th">Type</th>
                <th className="dashboard-table-th">Date</th>
                <th className="dashboard-table-th">Size</th>
                <th className="dashboard-table-th">Status</th>
                <th className="dashboard-table-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((r, index) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="dashboard-table-row da-table-row"
                >
                  <td className="dashboard-table-td">
                    <span className="text-xs font-mono" style={{ color: "var(--da-teal)" }}>{r.id}</span>
                  </td>
                  <td className="dashboard-table-td dashboard-table-td-primary max-w-[18rem] truncate">{r.title}</td>
                  <td className="dashboard-table-td whitespace-nowrap">{r.type}</td>
                  <td className="dashboard-table-td whitespace-nowrap text-xs">{r.date}</td>
                  <td className="dashboard-table-td text-xs">{r.size}</td>
                  <td className="dashboard-table-td">
                    <span className={`dashboard-table-badge ${statusBadge[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="dashboard-table-td">
                    {r.status === "Ready" && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.96 }}
                        aria-label={`Download ${r.title}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                      >
                        <Download size={13} />
                      </motion.button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
