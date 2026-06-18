"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useEscalationStore } from "@/store/escalationStore";
import { filterByDistrictScope } from "@/lib/district-scope";
import type { EscalationPriority, EscalationStatus } from "@/store/escalationStore";

const priorityBadgeClass: Record<EscalationPriority, string> = {
  Critical: "dashboard-table-badge-risk-critical",
  High: "dashboard-table-badge-priority-high",
  Medium: "dashboard-table-badge-priority-medium",
  Low: "dashboard-table-badge-priority-low",
};

const statusBadgeClass: Record<EscalationStatus, string> = {
  "Pending Review": "dashboard-table-badge-status-review",
  Assigned: "dashboard-table-badge-status-escalated",
  Investigating: "dashboard-table-badge-status-review",
  Resolved: "dashboard-table-badge-status-resolved",
  Closed: "dashboard-table-badge-status-open",
};

export default function EscalationsTable() {
  const router = useRouter();
  const all = useEscalationStore((s) => s.escalations);
  const escalations = filterByDistrictScope(all, (e) => e.district, (e) => e.state)
    .filter((e) => !["Resolved", "Closed"].includes(e.status))
    .slice(0, 8);

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col p-5"
    >
      <div className="dashboard-table-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">Recent Escalations</h3>
          <p className="text-muted mt-1 text-xs">Active & pending district escalations</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/district-admin/dashboard/escalation")}
          className="da-btn-secondary shrink-0 !h-9 !px-3 !text-xs"
        >
          View All
        </button>
      </div>

      <div className="dashboard-table-scroll flex-1" style={{ maxHeight: "22rem" }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="dashboard-table-th">Escalation ID</th>
              <th className="dashboard-table-th">Title</th>
              <th className="dashboard-table-th">Sub-District</th>
              <th className="dashboard-table-th">Priority</th>
              <th className="dashboard-table-th">Status</th>
              <th className="dashboard-table-th">Days Open</th>
            </tr>
          </thead>
          <tbody>
            {escalations.length === 0 ? (
              <tr>
                <td colSpan={6} className="dashboard-table-td text-center text-xs text-[var(--color-text-muted)] py-6">
                  No active escalations
                </td>
              </tr>
            ) : (
              escalations.map((e, index) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="dashboard-table-row da-table-row"
                >
                  <td className="dashboard-table-td">
                    <Link href={`/district-admin/dashboard/escalation/${e.id}`} className="flex min-w-0 items-center gap-2">
                      <ShieldAlert size={14} className="shrink-0 text-teal-400" />
                      <span className="dashboard-table-td-mono truncate hover:underline" style={{ color: "var(--da-teal)" }}>
                        {e.id}
                      </span>
                    </Link>
                  </td>
                  <td className="dashboard-table-td dashboard-table-td-primary max-w-[12rem] truncate">{e.title}</td>
                  <td className="dashboard-table-td whitespace-nowrap">{e.subDistrict}</td>
                  <td className="dashboard-table-td">
                    <span className={`dashboard-table-badge ${priorityBadgeClass[e.priority]}`}>{e.priority}</span>
                  </td>
                  <td className="dashboard-table-td">
                    <span className={`dashboard-table-badge ${statusBadgeClass[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="dashboard-table-td tabular-nums">
                    <span
                      className={`text-xs font-semibold ${
                        e.daysOpen >= 7 ? "text-red-400" : e.daysOpen >= 4 ? "text-amber-400" : "text-teal-400"
                      }`}
                    >
                      {e.daysOpen === 0 ? "—" : `${e.daysOpen}d`}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
