"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type { MyReport } from "./types";

interface ExportButtonProps {
  reports: MyReport[];
}

function generateCSV(reports: MyReport[]): string {
  const headers = [
    "Report ID",
    "Title",
    "Hazard Type",
    "Severity",
    "Status",
    "Location",
    "Road",
    "District",
    "State",
    "Upvotes",
    "Comments",
    "Views",
    "Created At",
    "Last Updated",
    "Assigned To",
  ];

  const rows = reports.map((r) => [
    r.reportId,
    `"${r.title.replace(/"/g, '""')}"`,
    r.hazardType,
    r.severity,
    r.status,
    r.location.name,
    r.location.road,
    r.location.district,
    r.location.state,
    String(r.upvotes),
    String(r.comments),
    String(r.views),
    new Date(r.createdAt).toLocaleDateString("en-IN"),
    new Date(r.lastUpdatedAt).toLocaleDateString("en-IN"),
    r.assignedTo || "N/A",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function downloadCSV(reports: MyReport[]) {
  const csv = generateCSV(reports);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPrintDialog() {
  window.print();
}

export function ExportButton({ reports }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-colors"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Export</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-neu-lg)] p-1.5 min-w-[160px]"
            >
              <button
                onClick={() => { downloadCSV(reports); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet size={14} className="text-[var(--color-success)]" />
                Export as CSV
              </button>
              <button
                onClick={() => { openPrintDialog(); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2"
              >
                <FileText size={14} className="text-[var(--color-info)]" />
                Export as PDF
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
