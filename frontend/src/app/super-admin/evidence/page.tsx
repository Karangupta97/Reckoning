"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, XCircle, Flag, Search } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  EVIDENCE_STATUS_CLS,
  EVIDENCE_TABS,
  filterEvidenceByTab,
  type EvidenceQueueTab,
} from "@/components/super-admin-dashboard/evidence-ui";
import { useEvidenceStore } from "@/store/evidenceStore";

const TAB_PARAM: Record<string, EvidenceQueueTab> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  flagged: "flagged",
};

export default function EvidenceManagementPage() {
  const searchParams = useSearchParams();
  const initialTab = TAB_PARAM[searchParams.get("tab") ?? ""] ?? "pending";
  const records = useEvidenceStore((s) => s.records);
  const [tab, setTab] = useState<EvidenceQueueTab>(initialTab);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const byTab = filterEvidenceByTab(tab, records);
    const q = search.toLowerCase().trim();
    if (!q) return byTab;
    return byTab.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.relatedEntityId.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.uploadedBy.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q)
    );
  }, [tab, records, search]);

  const stats = useMemo(
    () => ({
      pending: filterEvidenceByTab("pending", records).length,
      approved: filterEvidenceByTab("approved", records).length,
      rejected: filterEvidenceByTab("rejected", records).length,
      flagged: filterEvidenceByTab("flagged", records).length,
    }),
    [records]
  );

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Camera size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Evidence Management Center</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Review, approve, and flag evidence submitted for complaints and escalations
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: "Pending Review", value: String(stats.pending), color: "text-amber-400", icon: Camera },
          { label: "Approved", value: String(stats.approved), color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Rejected", value: String(stats.rejected), color: "text-red-400", icon: XCircle },
          { label: "Flagged", value: String(stats.flagged), color: "text-orange-400", icon: Flag },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <s.icon size={16} className={`mb-1 ${s.color}`} />
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {EVIDENCE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-transparent"
                }`}
              >
                {t.label}
                <span className="ml-1.5 opacity-60">({filterEvidenceByTab(t.id, records).length})</span>
              </button>
            ))}
          </div>
          <div
            className="flex items-center gap-2 rounded-lg border px-3 h-9 w-full sm:w-64"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, district, uploader…"
              className="bg-transparent text-xs outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] w-full"
            />
          </div>
        </div>

        <DashboardCard className="mt-3">
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {["Evidence ID", "Related ID", "District", "Title", "Uploaded By", "Upload Time", "Files", "Status"].map((h) => (
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
                      No evidence in this queue.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="dashboard-table-row"
                    >
                      <td className="dashboard-table-td dashboard-table-td-mono text-xs">
                        <Link href={`/super-admin/evidence/${r.id}`} className="text-cyan-400 hover:underline font-semibold">
                          {r.id}
                        </Link>
                      </td>
                      <td className="dashboard-table-td text-xs font-mono">
                        <Link
                          href={
                            r.relatedEntityType === "Escalation"
                              ? `/super-admin/complaints/escalated-cases/${r.relatedEntityId}`
                              : `/super-admin/complaints/citizen-complaints/${r.relatedEntityId}`
                          }
                          className="text-[var(--color-text-secondary)] hover:text-cyan-400 hover:underline"
                        >
                          {r.relatedEntityId}
                        </Link>
                        <span className="block text-[10px] text-[var(--color-text-muted)]">{r.relatedEntityType}</span>
                      </td>
                      <td className="dashboard-table-td text-sm">
                        <div className="font-medium text-[var(--color-text-primary)]">{r.district}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">{r.state}</div>
                      </td>
                      <td className="dashboard-table-td text-xs max-w-[180px] truncate" title={r.title}>
                        {r.title}
                      </td>
                      <td className="dashboard-table-td text-xs">{r.uploadedBy}</td>
                      <td className="dashboard-table-td text-xs whitespace-nowrap">{r.uploadedAt}</td>
                      <td className="dashboard-table-td text-xs">{r.files.length}</td>
                      <td className="dashboard-table-td">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${EVIDENCE_STATUS_CLS[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {filtered.length} of {records.length} evidence records
            </span>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
