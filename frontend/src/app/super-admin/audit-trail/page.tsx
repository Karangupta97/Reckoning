"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, Download, X, Activity, BarChart3 } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  useAuditLogStore,
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_COLOR,
  type AuditCategory,
} from "@/store/auditLogStore";
import { exportAuditLog } from "@/lib/report-generator";

const ENTITY_PREFIXES = [
  { label: "All", value: "" },
  { label: "Complaints", value: "CMP" },
  { label: "Escalations", value: "ESC" },
  { label: "Evidence", value: "EV" },
  { label: "Budget", value: "BUD" },
  { label: "Governance", value: "GOV" },
  { label: "Users", value: "USR" },
];

export default function AuditTrailPage() {
  const entries = useAuditLogStore((s) => s.entries);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");

  const filtered = useMemo(() => {
    let result = entries;
    if (categoryFilter) result = result.filter((e) => e.category === categoryFilter);
    if (entityFilter) result = result.filter((e) => e.entityId.startsWith(entityFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.action.toLowerCase().includes(q) || e.entityId.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, categoryFilter, entityFilter, search]);

  // Statistics
  const escEvents = entries.filter((e) => e.category === "Escalations").length;
  const budgetEvents = entries.filter((e) => e.category === "Budget Decisions").length;
  const evidenceEvents = entries.filter((e) => e.category === "Evidence Decisions").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-cyan-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Audit Trail Center</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Complete governance action history</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => exportAuditLog(categoryFilter ? { category: categoryFilter } : entityFilter ? { entityType: entityFilter } : undefined)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border text-xs font-medium"
          style={{ borderColor: "rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: "#22d3ee" }}>
          <Download size={14} /> Export CSV
        </motion.button>
      </motion.div>

      {/* Statistics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Events", value: String(entries.length), color: "text-cyan-400" },
          { label: "Escalation Events", value: String(escEvents), color: "text-orange-400" },
          { label: "Budget Decisions", value: String(budgetEvents), color: "text-amber-400" },
          { label: "Evidence Decisions", value: String(evidenceEvents), color: "text-purple-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Category chips */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        <button onClick={() => setCategoryFilter("")}
          className="h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all"
          style={{ background: !categoryFilter ? "rgba(34,211,238,0.12)" : "var(--color-surface)", color: !categoryFilter ? "#22d3ee" : "var(--color-text-muted)", border: `1px solid ${!categoryFilter ? "rgba(34,211,238,0.3)" : "var(--color-border)"}` }}>
          All
        </button>
        {AUDIT_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? "" : cat)}
            className="h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all"
            style={{ background: categoryFilter === cat ? "rgba(34,211,238,0.12)" : "var(--color-surface)", color: categoryFilter === cat ? "#22d3ee" : "var(--color-text-muted)", border: `1px solid ${categoryFilter === cat ? "rgba(34,211,238,0.3)" : "var(--color-border)"}` }}>
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Search + entity filter */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, entity ID, or actor…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-cyan-400/50" />
        </div>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] focus:outline-none">
          {ENTITY_PREFIXES.map((ep) => <option key={ep.value} value={ep.value}>{ep.label}</option>)}
        </select>
        {(search || categoryFilter || entityFilter) && (
          <button onClick={() => { setSearch(""); setCategoryFilter(""); setEntityFilter(""); }}
            className="flex items-center gap-1 h-9 px-3 rounded-lg border text-xs text-[var(--color-text-muted)] border-[var(--color-border)]">
            <X size={12} /> Clear
          </button>
        )}
      </motion.div>

      {/* Results info */}
      <div className="text-[10px] text-[var(--color-text-muted)]">
        Showing {filtered.length} of {entries.length} entries
      </div>

      {/* Audit table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <DashboardCard className="flex flex-col">
          <div className="dashboard-table-scroll" style={{ maxHeight: "480px" }}>
            <table className="dashboard-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="dashboard-table-th">ID</th>
                  <th className="dashboard-table-th">Timestamp</th>
                  <th className="dashboard-table-th">Actor</th>
                  <th className="dashboard-table-th">Action</th>
                  <th className="dashboard-table-th">Entity</th>
                  <th className="dashboard-table-th">Previous</th>
                  <th className="dashboard-table-th">New</th>
                  <th className="dashboard-table-th">Category</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((entry, i) => (
                  <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                    className="dashboard-table-row">
                    <td className="dashboard-table-td"><span className="text-[11px] font-mono text-cyan-400">{entry.id}</span></td>
                    <td className="dashboard-table-td text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">{entry.timestamp}</td>
                    <td className="dashboard-table-td text-xs whitespace-nowrap">{entry.actor}</td>
                    <td className="dashboard-table-td text-xs max-w-[200px] truncate" title={entry.action}>{entry.action}</td>
                    <td className="dashboard-table-td"><span className="text-[11px] font-mono font-medium text-[var(--color-text-primary)]">{entry.entityId}</span></td>
                    <td className="dashboard-table-td text-[11px] text-[var(--color-text-muted)]">{entry.previousStatus}</td>
                    <td className="dashboard-table-td text-[11px] font-medium text-[var(--color-text-primary)]">{entry.newStatus}</td>
                    <td className="dashboard-table-td">
                      <span className={`text-[10px] font-medium ${AUDIT_CATEGORY_COLOR[entry.category as AuditCategory] ?? "text-[var(--color-text-muted)]"}`}>
                        {entry.category}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
              <span className="text-[11px] text-[var(--color-text-muted)]">Showing 50 of {filtered.length} — export for full data</span>
            </div>
          )}
        </DashboardCard>
      </motion.div>

      {/* Recent Activity Timeline */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Activity Timeline</h3>
          </div>
          <div className="flex flex-col gap-2">
            {entries.slice(0, 8).map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.03 }}
                className="flex items-start gap-3 rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: AUDIT_CATEGORY_COLOR[entry.category as AuditCategory] ? "currentColor" : "#64748b" }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-cyan-400">{entry.entityId}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{entry.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">{entry.action}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
