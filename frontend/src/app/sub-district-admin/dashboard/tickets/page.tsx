"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, ClipboardCheck, ClipboardList, Clock, CheckCircle2, AlertTriangle, Search, Plus } from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useComplaintWorkflowStore, type TicketStatus } from "@/store/complaintWorkflowStore";

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

const KPI_META = [
  { label: "Open Tickets", status: "Open" as const, icon: ClipboardCheck, color: "var(--sda-amber)" },
  { label: "In Progress", status: "In Progress" as const, icon: Clock, color: "var(--color-info)" },
  { label: "Overdue", status: "Overdue" as const, icon: AlertTriangle, color: "var(--color-danger)" },
  { label: "Completed", status: "Completed" as const, icon: CheckCircle2, color: "var(--color-success)" },
];

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const showCreate = searchParams.get("create") === "1";
  const storeTickets = useComplaintWorkflowStore((s) => s.tickets);
  const submitTicket = useComplaintWorkflowStore((s) => s.submitTicket);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(showCreate);
  const [complaintId, setComplaintId] = useState("CMP-1024");
  const [team, setTeam] = useState("Road Crew Alpha");
  const [assignedOfficer, setAssignedOfficer] = useState("V. Kamble");
  const [priority, setPriority] = useState("High");
  const [due, setDue] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const kpis = useMemo(
    () =>
      KPI_META.map((k) => ({
        ...k,
        value: storeTickets.filter((t) => t.status === k.status).length,
      })),
    [storeTickets]
  );

  const filtered = useMemo(() => {
    return storeTickets.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.complaintId.toLowerCase().includes(q) ||
          t.team.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, filterStatus, storeTickets]);

  const handleCreateTicket = () => {
    if (!complaintId.trim() || !due) return;
    const id = submitTicket({
      complaintId: complaintId.trim().toUpperCase(),
      team,
      priority,
      due,
      assignedOfficer: assignedOfficer.trim() || team,
    });
    setToast(`Ticket ${id} created — district notified`);
    setCreateOpen(false);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
        <a href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</a>
        <span className="opacity-40">›</span>
        <span className="text-[var(--color-text-secondary)] font-medium">Tickets</span>
      </nav>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Work Order Management Console</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Track and manage all field work tickets for Panvel Taluka</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(!createOpen)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold"
          style={{ borderColor: "var(--sda-border-amber)", color: "var(--sda-amber)" }}>
          <Plus size={14} /> Create Ticket
        </button>
      </motion.div>

      {toast && <div className="rounded-lg border px-3 py-2 text-xs text-emerald-400" style={{ borderColor: "rgba(16,185,129,0.3)" }}>{toast}</div>}

      {createOpen && (
        <DashboardCard className="p-4 flex flex-col gap-3">
          <h2 className="text-sm font-bold">New Work Ticket</h2>
          <div className="grid grid-cols-2 gap-2">
            <input value={complaintId} onChange={(e) => setComplaintId(e.target.value)} placeholder="CMP-1024" className="rounded-lg border px-3 py-2 text-xs font-mono" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Team" className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
            <input value={assignedOfficer} onChange={(e) => setAssignedOfficer(e.target.value)} placeholder="Assigned officer" className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <button type="button" onClick={handleCreateTicket} className="self-end rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--sda-amber)" }}>Submit to District</button>
        </DashboardCard>
      )}

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

      <DashboardCard
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col"
      >
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
            {(["Open", "In Progress", "Overdue", "Completed"] as TicketStatus[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList size={24} className="text-[var(--color-text-muted)] opacity-40" />
                      <p className="text-sm text-[var(--color-text-muted)]">No tickets match your filters</p>
                      <p className="text-xs text-[var(--color-text-muted)] opacity-70">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="dashboard-table-row sda-table-row"
                >
                  <td className="dashboard-table-td dashboard-table-td-primary font-mono text-xs">{t.id}</td>
                  <td className="dashboard-table-td">
                    <Link href={`/sub-district-admin/dashboard/complaints/${t.complaintId}`}>
                      <span className="text-xs font-mono hover:underline" style={{ color: "var(--sda-amber)" }}>
                        {t.complaintId}
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
            Showing {filtered.length} of {storeTickets.length} tickets
          </span>
        </div>
      </DashboardCard>
    </div>
  );
}
