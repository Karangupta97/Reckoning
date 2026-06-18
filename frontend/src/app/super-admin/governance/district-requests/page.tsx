"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useGovernanceRequestStore } from "@/store/governanceRequestStore";

const STATUS_CLS: Record<string, string> = {
  "Pending Review": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  Rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
  "Clarification Requested": "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  "Under Audit": "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  "Sent Back For Review": "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

export default function DistrictGovernanceRequestsPage() {
  const requests = useGovernanceRequestStore((s) => s.requests);
  const pending = requests.filter((r) => r.status === "Pending Review" || r.status === "Clarification Requested");

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Shield size={20} className="text-cyan-400" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">District Governance Requests</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Review policy, access, and compliance requests from districts</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DashboardCard className="py-4 text-center">
          <span className="text-xl font-bold text-amber-400">{pending.length}</span>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Pending Review</p>
        </DashboardCard>
        <DashboardCard className="py-4 text-center">
          <span className="text-xl font-bold text-emerald-400">{requests.filter((r) => r.status === "Approved").length}</span>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Approved</p>
        </DashboardCard>
        <DashboardCard className="py-4 text-center">
          <span className="text-xl font-bold text-slate-400">{requests.length}</span>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Total</p>
        </DashboardCard>
      </div>

      <DashboardCard>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>{["Request ID", "District", "Title", "Type", "Submitted By", "Status"].map((h) => <th key={h} className="dashboard-table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="dashboard-table-row">
                  <td className="dashboard-table-td dashboard-table-td-mono text-xs">
                    <Link href={`/super-admin/governance/district-requests/${r.id}`} className="text-cyan-400 hover:underline font-semibold">{r.id}</Link>
                  </td>
                  <td className="dashboard-table-td text-sm">{r.district}</td>
                  <td className="dashboard-table-td text-xs max-w-[200px] truncate">{r.title}</td>
                  <td className="dashboard-table-td text-xs">{r.type}</td>
                  <td className="dashboard-table-td text-xs">{r.submittedBy}</td>
                  <td className="dashboard-table-td">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CLS[r.status]}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
