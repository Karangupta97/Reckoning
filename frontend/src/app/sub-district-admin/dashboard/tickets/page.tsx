"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

// ─── Mock data ─────────────────────────────────────────────────
const ALL_TICKETS = [
  { id: "TKT-0501", complaint: "CMP-1024", team: "Road Crew Alpha", priority: "Critical", created: "2025-01-14", due: "2025-01-16", status: "Open" },
  { id: "TKT-0500", complaint: "CMP-1021", team: "Sanitation Unit B", priority: "High", created: "2025-01-14", due: "2025-01-17", status: "In Progress" },
  { id: "TKT-0499", complaint: "CMP-1019", team: "Road Crew Alpha", priority: "Critical", created: "2025-01-12", due: "2025-01-14", status: "Overdue" },
  { id: "TKT-0498", complaint: "CMP-1018", team: "Utilities Team", priority: "High", created: "2025-01-11", due: "2025-01-15", status: "In Progress" },
  { id: "TKT-0497", complaint: "CMP-1017", team: "Horticulture Unit", priority: "Medium", created: "2025-01-11", due: "2025-01-18", status: "Completed" },
  { id: "TKT-0496", complaint: "CMP-1022", team: "Electrical Crew", priority: "Medium", created: "2025-01-13", due: "2025-01-19", status: "In Progress" },
  { id: "TKT-0495", complaint: "CMP-1016", team: "Inspection Unit", priority: "Low", created: "2025-01-10", due: "2025-01-20", status: "Open" },
  { id: "TKT-0494", complaint: "CMP-1023", team: "Road Crew Beta", priority: "High", created: "2025-01-14", due: "2025-01-16", status: "Open" },
  { id: "TKT-0493", complaint: "CMP-1013", team: "Drainage Team", priority: "Medium", created: "2025-01-09", due: "2025-01-17", status: "In Progress" },
  { id: "TKT-0492", complaint: "CMP-1014", team: "Road Crew Alpha", priority: "Critical", created: "2025-01-09", due: "2025-01-11", status: "Completed" },
];

const STATUS_COLORS: Record<string, string> = {
  Open: "dashboard-table-badge-status-open",
  "In Progress": "dashboard-table-badge-status-review",
  Overdue: "dashboard-table-badge-status-open",
  Completed: "dashboard-table-badge-status-resolved",
};
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "dashboard-table-badge-status-open",
  High: "dashboard-table-badge-status-escalated",
  Medium: "dashboard-table-badge-status-review",
  Low: "dashboard-table-badge-status-resolved",
};

const kpis = [
  { label: "Open Tickets", value: 4, icon: ClipboardCheck, color: "var(--sda-amber)" },
  { label: "In Progress", value: 4, icon: Clock, color: "var(--color-info)" },
  { label: "Overdue", value: 1, icon: AlertTriangle, color: "var(--color-danger)" },
  { label: "Completed", value: 2, icon: CheckCircle2, color: "var(--color-success)" },
];

export default function TicketsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = useMemo(() => {
    return ALL_TICKETS.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.id.toLowerCase().includes(q) || t.complaint.toLowerCase().includes(q) || t.team.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, filterStatus]);

  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
        <a href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</a>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium">Tickets</span>
      </nav>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Work Order Management Console</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Track and manage all field work tickets for Panvel Taluka</p>
      </motion.div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <DashboardCard
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
            className="p-4 flex items-center gap-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={{
                borderColor: `color-mix(in srgb, ${k.color} 30%, transparent)`,
                background: `color-mix(in srgb, ${k.color} 10%, transparent)`,
              }}
            >
              <k.icon size={18} style={{ color: k.color }} />
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--color-text-primary)]">{k.value}</div>
              <div className="text-[10px] text-[var(--color-text-muted)] leading-tight">{k.label}</div>
            </div>
          </DashboardCard>
        ))}
      </section>

      {/* Table card */}
      <DashboardCard
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col"
      >
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-[var(--color-border)]">
          <label className="sda-header-search flex-1 min-w-[180px] max-w-xs">
            <Search size={15} className="text-muted shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="text-primary text-sm"
            />
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-lg border px-3 text-sm bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
          >
            <option value="">All Statuses</option>
            {["Open", "In Progress", "Overdue", "Completed"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="dashboard-table-scroll flex-1">
          <table className="dashboard-table">
            <thead>
              <tr>
                {["Ticket ID", "Related Complaint", "Assigned Team", "Priority", "Created Date", "Due Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="dashboard-table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="dashboard-table-row sda-table-row"
                >
                  <td className="dashboard-table-td dashboard-table-td-primary font-mono text-xs">{t.id}</td>
                  <td className="dashboard-table-td">
                    <Link href={`/sub-district-admin/dashboard/complaints/${t.complaint}`}>
                      <span className="text-xs font-mono hover:underline" style={{ color: "var(--sda-amber)" }}>
                        {t.complaint}
                      </span>
                    </Link>
                  </td>
                  <td className="dashboard-table-td text-xs">{t.team}</td>
                  <td className="dashboard-table-td">
                    <span className={`dashboard-table-badge ${PRIORITY_COLORS[t.priority] ?? ""}`}>{t.priority}</span>
                  </td>
                  <td className="dashboard-table-td text-xs font-mono">{t.created}</td>
                  <td className="dashboard-table-td">
                    <span className={`text-xs font-mono ${t.status === "Overdue" ? "text-red-400 font-bold" : "text-[var(--color-text-secondary)]"}`}>
                      {t.due}
                    </span>
                  </td>
                  <td className="dashboard-table-td">
                    <span className={`dashboard-table-badge ${STATUS_COLORS[t.status] ?? ""}`}>{t.status}</span>
                  </td>
                  <td className="dashboard-table-td">
                    <Link href={`/sub-district-admin/dashboard/tickets/${t.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium transition-all"
                        style={{
                          borderColor: "var(--sda-border-amber)",
                          background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)",
                          color: "var(--sda-amber)",
                        }}
                      >
                        <Eye size={12} /> View
                      </motion.button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">
            Showing {filtered.length} of {ALL_TICKETS.length} tickets
          </span>
        </div>
      </DashboardCard>
    </div>
  );
}
