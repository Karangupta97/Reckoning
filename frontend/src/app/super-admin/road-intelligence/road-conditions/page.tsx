"use client";

import { motion } from "framer-motion";
import { Route, AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useRoadIntelligence } from "@/hooks/use-road-intelligence";
import { useIsClient } from "@/hooks/useIsClient";

const RISK_COLORS: Record<string, string> = { Healthy: "#22c55e", Watchlist: "#f59e0b", "At Risk": "#f97316", Critical: "#ef4444" };

export default function RoadConditionsPage() {
  const ri = useRoadIntelligence();
  const isClient = useIsClient();

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Route size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Road Conditions</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Infrastructure risk assessment derived from governance data</p>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Roads Monitored", value: String(ri.roadsMonitored), color: "text-cyan-400" },
          { label: "Healthy Infrastructure", value: `${ri.healthyPct}%`, color: "text-emerald-400" },
          { label: "Needs Attention", value: `${ri.needsAttentionPct}%`, color: "text-amber-400" },
          { label: "Critical Risk", value: `${ri.criticalPct}%`, color: "text-red-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Two-column: Risk Pie + Critical Corridors */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Risk Distribution Donut */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <DashboardCard className="p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Road Risk Distribution</h3>
            <div className="h-[260px] w-full">
              {isClient && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ri.riskDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} cx="50%" cy="50%">
                      {ri.riskDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend verticalAlign="bottom" iconSize={10} wrapperStyle={{ fontSize: "12px", color: "var(--color-text-secondary)" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </motion.div>

        {/* Most Critical Corridors */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <DashboardCard className="p-5 flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Most Critical Corridors</h3>
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto" style={{ maxHeight: "280px" }}>
              {ri.corridors.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.03 }}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{c.name}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{c.district}, {c.state}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-[var(--color-text-muted)]">{c.complaints} CMP · {c.escalations} ESC</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${RISK_COLORS[c.riskLevel]}15`, color: RISK_COLORS[c.riskLevel] }}>
                      {c.riskLevel}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </DashboardCard>
        </motion.div>
      </div>

      {/* District Risk Ranking Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="flex flex-col">
          <div className="px-5 pt-4 pb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">District Risk Ranking</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Ranked by composite risk score (complaints + escalations + SLA breaches)</p>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="dashboard-table-th">#</th>
                  <th className="dashboard-table-th">District</th>
                  <th className="dashboard-table-th">State</th>
                  <th className="dashboard-table-th">Complaints</th>
                  <th className="dashboard-table-th">Escalations</th>
                  <th className="dashboard-table-th">SLA Breaches</th>
                  <th className="dashboard-table-th">Risk Score</th>
                  <th className="dashboard-table-th">Level</th>
                </tr>
              </thead>
              <tbody>
                {ri.districtRisks.map((d, i) => (
                  <motion.tr key={d.district} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="dashboard-table-row">
                    <td className="dashboard-table-td text-xs font-bold text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="dashboard-table-td">
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">{d.district}</p>
                        {d.affectedTalukas.length > 0 && (
                          <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{d.affectedTalukas.join(", ")}</p>
                        )}
                      </div>
                    </td>
                    <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)]">{d.state}</td>
                    <td className="dashboard-table-td text-xs tabular-nums">{d.complaints}</td>
                    <td className="dashboard-table-td text-xs tabular-nums text-orange-400">{d.escalations}</td>
                    <td className="dashboard-table-td text-xs tabular-nums text-red-400">{d.breaches}</td>
                    <td className="dashboard-table-td">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full overflow-hidden bg-[var(--color-surface)]">
                          <div className="h-full rounded-full" style={{ width: `${d.riskScore}%`, background: RISK_COLORS[d.riskLevel] }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums" style={{ color: RISK_COLORS[d.riskLevel] }}>{d.riskScore}</span>
                      </div>
                    </td>
                    <td className="dashboard-table-td">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${RISK_COLORS[d.riskLevel]}15`, color: RISK_COLORS[d.riskLevel] }}>
                        {d.riskLevel}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
