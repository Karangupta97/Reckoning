"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Search,
  User,
  Shield,
  IndianRupee,
  AlertTriangle,
  Camera,
  FileCheck,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_CLS,
  AUDIT_CATEGORY_COLOR,
  useAuditLogStore,
  type AuditCategory,
} from "@/store/auditLogStore";

const CAT_ICON: Record<AuditCategory, typeof User> = {
  "User Actions": User,
  "Approval Actions": FileCheck,
  Escalations: AlertTriangle,
  "Budget Decisions": IndianRupee,
  "Evidence Decisions": Camera,
};

const CAT_PARAM: Record<string, AuditCategory> = {
  "User Actions": "User Actions",
  "Approval Actions": "Approval Actions",
  Escalations: "Escalations",
  "Budget Decisions": "Budget Decisions",
  "Evidence Decisions": "Evidence Decisions",
};

export default function AuditLogCenterPage() {
  const searchParams = useSearchParams();
  const initialCategory = CAT_PARAM[searchParams.get("category") ?? ""] ?? "";
  const initialEntity = searchParams.get("entity") ?? "";

  const entries = useAuditLogStore((s) => s.entries);
  const [search, setSearch] = useState(initialEntity);
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | "">(initialCategory);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter((e) => {
      const matchCat = !categoryFilter || e.category === categoryFilter;
      const matchQ =
        !q ||
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.entityId.toLowerCase().includes(q) ||
        e.userRole.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [entries, search, categoryFilter]);

  const counts = useMemo(
    () =>
      AUDIT_CATEGORIES.reduce(
        (acc, c) => {
          acc[c] = entries.filter((e) => e.category === c).length;
          return acc;
        },
        {} as Record<AuditCategory, number>
      ),
    [entries]
  );

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-cyan-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Audit Log Center</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Unified trail of user actions, approvals, escalations, budget, and evidence decisions
            </p>
          </div>
        </div>
        <Link
          href="/super-admin/evidence"
          className="text-xs text-cyan-400 hover:underline shrink-0"
        >
          Evidence Center →
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      >
        {AUDIT_CATEGORIES.map((c) => {
          const Icon = CAT_ICON[c];
          return (
            <DashboardCard
              key={c}
              className={`flex flex-col items-center justify-center py-3 px-2 text-center cursor-pointer transition-colors ${
                categoryFilter === c ? "ring-1 ring-cyan-500/40" : ""
              }`}
              onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}
            >
              <Icon size={14} className={`mb-1 ${AUDIT_CATEGORY_COLOR[c]}`} />
              <span className={`text-lg font-bold ${AUDIT_CATEGORY_COLOR[c]}`}>{counts[c]}</span>
              <span className="mt-0.5 text-[10px] text-[var(--color-text-muted)] leading-tight">{c}</span>
            </DashboardCard>
          );
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DashboardCard className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div
              className="flex items-center gap-2 rounded-lg border px-3 h-9 flex-1 min-w-[180px] max-w-md"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actor, action, entity ID…"
                className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full"
              />
            </div>
            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Clear filter: {categoryFilter}
              </button>
            )}
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {["Timestamp", "User Role", "Actor", "Action", "Entity ID", "Previous", "New Status", "Category"].map((h) => (
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
                      No audit entries match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e, i) => {
                    const Icon = CAT_ICON[e.category];
                    return (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="dashboard-table-row"
                      >
                        <td className="dashboard-table-td text-xs whitespace-nowrap text-[var(--color-text-muted)]">{e.timestamp}</td>
                        <td className="dashboard-table-td text-xs">{e.userRole}</td>
                        <td className="dashboard-table-td text-xs whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <User size={11} className="text-[var(--color-text-muted)]" />
                            {e.actor}
                          </span>
                        </td>
                        <td className="dashboard-table-td text-xs max-w-[14rem] truncate" title={e.action}>
                          {e.action}
                        </td>
                        <td className="dashboard-table-td dashboard-table-td-mono text-xs">
                          <EntityLink entityId={e.entityId} category={e.category} />
                        </td>
                        <td className="dashboard-table-td text-xs text-[var(--color-text-muted)]">{e.previousStatus}</td>
                        <td className="dashboard-table-td text-xs font-medium">{e.newStatus}</td>
                        <td className="dashboard-table-td">
                          <span className={`dashboard-table-badge flex items-center gap-1 w-fit ${AUDIT_CATEGORY_CLS[e.category]}`}>
                            <Icon size={10} />
                            {e.category}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {filtered.length} of {entries.length} entries
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
              <Shield size={10} /> Frontend audit trail — state resets on refresh
            </span>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}

function EntityLink({ entityId, category }: { entityId: string; category: AuditCategory }) {
  if (entityId.startsWith("EV-")) {
    return (
      <Link href={`/super-admin/evidence/${entityId}`} className="text-cyan-400 hover:underline">
        {entityId}
      </Link>
    );
  }
  if (entityId.startsWith("BUD-")) {
    return (
      <Link href={`/super-admin/governance/approvals/${entityId}`} className="text-cyan-400 hover:underline">
        {entityId}
      </Link>
    );
  }
  if (entityId.startsWith("ESC-")) {
    return (
      <Link href={`/super-admin/complaints/escalated-cases/${entityId}`} className="text-cyan-400 hover:underline">
        {entityId}
      </Link>
    );
  }
  if (entityId.startsWith("CMP-")) {
    return (
      <Link href={`/super-admin/complaints/citizen-complaints/${entityId}`} className="text-cyan-400 hover:underline">
        {entityId}
      </Link>
    );
  }
  return <span title={category}>{entityId}</span>;
}
