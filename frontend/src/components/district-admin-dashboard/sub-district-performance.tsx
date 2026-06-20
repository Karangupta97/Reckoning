"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { Users } from "lucide-react";
import { useComplaintStore } from "@/store/complaintStore";
import { useMemo } from "react";

interface SubDistrictRow {
  id: string;
  name: string;
  officer: string;
  complaints: number;
  resolved: number;
  sla: number;
  trend: "up" | "down" | "stable";
}

function computeRows(complaints: { subDistrict: string; status: string; slaStatus: string; officer: string }[]): SubDistrictRow[] {
  const map = new Map<string, { total: number; resolved: number; onTrack: number; officer: string }>();

  for (const c of complaints) {
    const sd = c.subDistrict || "Unknown";
    const cur = map.get(sd) ?? { total: 0, resolved: 0, onTrack: 0, officer: c.officer || "—" };
    cur.total++;
    if (c.status === "Resolved") cur.resolved++;
    if (c.slaStatus === "On Track") cur.onTrack++;
    if (c.officer && c.officer !== "Unassigned") cur.officer = c.officer;
    map.set(sd, cur);
  }

  return [...map.entries()]
    .map(([name, data], i) => {
      const sla = data.total > 0 ? Math.round((data.onTrack / data.total) * 100) : 0;
      const resRate = data.total > 0 ? data.resolved / data.total : 0;
      return {
        id: `SD-${String(i + 1).padStart(3, "0")}`,
        name: name.replace(" Taluka", ""),
        officer: data.officer,
        complaints: data.total,
        resolved: data.resolved,
        sla,
        trend: (resRate >= 0.7 ? "up" : resRate >= 0.5 ? "stable" : "down") as "up" | "down" | "stable",
      };
    })
    .sort((a, b) => b.sla - a.sla)
    .slice(0, 8);
}

function getSlaClass(sla: number) {
  if (sla >= 85) return "da-sla-bar-fill-good";
  if (sla >= 70) return "da-sla-bar-fill-warn";
  return "da-sla-bar-fill-critical";
}

function getSlaTextClass(sla: number) {
  if (sla >= 85) return "text-teal-400";
  if (sla >= 70) return "text-amber-400";
  return "text-red-400";
}

const trendIcon: Record<string, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

const trendClass: Record<string, string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  stable: "text-[var(--color-text-muted)]",
};

export default function SubDistrictPerformance() {
  const complaints = useComplaintStore((s) => s.complaints);
  const rows = useMemo(() => computeRows(complaints), [complaints]);
  const router = useRouter();

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5"
    >
      <div className="dashboard-table-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">
            Sub-District Performance
          </h3>
          <p className="text-muted mt-1 text-xs">
            SLA compliance & resolution rates
          </p>
        </div>
        <button type="button" onClick={() => router.push("/district-admin/reports")} className="da-btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          Full Report
        </button>
      </div>

      <div className="dashboard-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="dashboard-table-th">Sub-District</th>
              <th className="dashboard-table-th">Officer</th>
              <th className="dashboard-table-th">Complaints</th>
              <th className="dashboard-table-th">Resolved</th>
              <th className="dashboard-table-th">SLA Score</th>
              <th className="dashboard-table-th">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="dashboard-table-row da-table-row"
              >
                <td className="dashboard-table-td">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor: "var(--da-border-teal)",
                        background: "color-mix(in srgb, var(--da-teal) 10%, transparent)",
                        color: "var(--da-teal)",
                      }}
                    >
                      <Users size={14} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="dashboard-table-td-primary truncate text-sm">{row.name}</p>
                      <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--da-teal)" }}>
                        {row.id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="dashboard-table-td whitespace-nowrap">{row.officer}</td>
                <td className="dashboard-table-td dashboard-table-td-primary tabular-nums">{row.complaints}</td>
                <td className="dashboard-table-td tabular-nums">
                  <span className="text-emerald-400 font-medium">{row.resolved}</span>
                </td>
                <td className="dashboard-table-td">
                  <div className="flex min-w-[8rem] flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold tabular-nums ${getSlaTextClass(row.sla)}`}>
                        {row.sla}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${row.sla}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`h-full rounded-full ${getSlaClass(row.sla)}`}
                      />
                    </div>
                  </div>
                </td>
                <td className="dashboard-table-td">
                  <span className={`text-sm font-bold ${trendClass[row.trend]}`}>
                    {trendIcon[row.trend]}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
