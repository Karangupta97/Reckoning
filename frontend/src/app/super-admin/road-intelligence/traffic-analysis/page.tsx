"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Activity, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useRoadIntelligence } from "@/hooks/use-road-intelligence";
import { useIsClient } from "@/hooks/useIsClient";

export default function TrafficAnalysisPage() {
  const ri = useRoadIntelligence();
  const isClient = useIsClient();

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <BarChart3 size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Governance Activity Analysis</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Complaint volume, escalation velocity, and resolution trends</p>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Complaint Volume", value: String(ri.complaintVolume), color: "text-cyan-400" },
          { label: "Escalation Volume", value: String(ri.escalationVolume), color: "text-orange-400" },
          { label: "Resolution Rate", value: `${ri.resolutionVelocity}%`, color: "text-emerald-400" },
          { label: "Avg Response", value: `${ri.avgResponseHours}h`, color: "text-amber-400" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Complaint & Escalation Trend */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <DashboardCard className="p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Complaint & Escalation Trend</h3>
            <div className="flex items-center gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]"><span className="w-2 h-2 rounded-full bg-cyan-400" />Complaints</span>
              <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]"><span className="w-2 h-2 rounded-full bg-orange-400" />Escalations</span>
            </div>
            <div className="h-[220px] w-full">
              {isClient && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ri.trends} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="ri-cyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ri-orange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="complaints" stroke="#06b6d4" strokeWidth={2} fill="url(#ri-cyan)" dot={false} />
                    <Area type="monotone" dataKey="escalations" stroke="#f97316" strokeWidth={2} fill="url(#ri-orange)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </motion.div>

        {/* Resolution Trend */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <DashboardCard className="p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Resolution vs Created</h3>
            <div className="flex items-center gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]"><span className="w-2 h-2 rounded-full bg-red-400" />Created</span>
              <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]"><span className="w-2 h-2 rounded-full bg-emerald-400" />Resolved</span>
            </div>
            <div className="h-[220px] w-full">
              {isClient && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ri.trends} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="ri-red" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ri-green" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="complaints" stroke="#ef4444" strokeWidth={2} fill="url(#ri-red)" dot={false} name="Created" />
                    <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#ri-green)" dot={false} name="Resolved" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>
        </motion.div>
      </div>

      {/* Hotspot Zones */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="flex flex-col">
          <div className="px-5 pt-4 pb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Hotspot Zones</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Districts ranked by complaint and escalation density</p>
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
                  <th className="dashboard-table-th">Density Score</th>
                </tr>
              </thead>
              <tbody>
                {ri.districtRisks.slice(0, 8).map((d, i) => (
                  <motion.tr key={d.district} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="dashboard-table-row">
                    <td className="dashboard-table-td text-xs font-bold text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="dashboard-table-td text-xs font-medium text-[var(--color-text-primary)]">{d.district}</td>
                    <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)]">{d.state}</td>
                    <td className="dashboard-table-td text-xs tabular-nums text-cyan-400">{d.complaints}</td>
                    <td className="dashboard-table-td text-xs tabular-nums text-orange-400">{d.escalations}</td>
                    <td className="dashboard-table-td">
                      <span className="text-xs font-bold tabular-nums" style={{ color: d.riskScore >= 50 ? "#ef4444" : d.riskScore >= 25 ? "#f59e0b" : "#22c55e" }}>
                        {d.riskScore}
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
