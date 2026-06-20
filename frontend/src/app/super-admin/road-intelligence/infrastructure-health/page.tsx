"use client";

import { motion } from "framer-motion";
import { ShieldAlert, TrendingUp, AlertTriangle, CheckCircle2, IndianRupee, Zap, Brain } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { useRoadIntelligence, type ExecutiveInsight, type AIAlert } from "@/hooks/use-road-intelligence";

const STATUS_COLORS: Record<string, string> = { Excellent: "#22c55e", Good: "#10b981", Watchlist: "#f59e0b", Critical: "#ef4444" };
const SEVERITY_COLORS: Record<string, string> = { info: "#06b6d4", warning: "#f59e0b", danger: "#ef4444", success: "#22c55e" };
const PRIORITY_COLORS: Record<string, string> = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Watchlist" : "Critical";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tabular-nums" style={{ color }}>{score}</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">/100</span>
        </div>
      </div>
      <span className="text-sm font-bold" style={{ color }}>{label}</span>
      <p className="text-[10px] text-[var(--color-text-muted)] text-center max-w-[200px]">
        Weighted: 40% Resolution · 30% SLA · 20% Escalation · 10% Budget
      </p>
    </div>
  );
}

function InsightCard({ insight }: { insight: ExecutiveInsight }) {
  const color = SEVERITY_COLORS[insight.severity];
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
      style={{ borderColor: `${color}30`, background: `${color}08` }}>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-[var(--color-text-muted)]">{insight.label}</p>
        <p className="text-xs font-medium text-[var(--color-text-primary)]">{insight.value}</p>
      </div>
    </div>
  );
}

function AIAlertRow({ alert, index }: { alert: AIAlert; index: number }) {
  const color = PRIORITY_COLORS[alert.priority];
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.04 }}
      className="flex items-center justify-between rounded-lg border px-4 py-3"
      style={{ borderColor: `${color}25`, background: `${color}06` }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Zap size={12} style={{ color }} />
          <span className="text-xs font-bold text-[var(--color-text-primary)]">{alert.corridor}, {alert.state}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{alert.priority}</span>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{alert.reason}</p>
        {alert.affectedTalukas.length > 0 && (
          <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">Affected Talukas: {alert.affectedTalukas.join(", ")}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="h-1.5 w-12 rounded-full overflow-hidden bg-[var(--color-surface)]">
          <div className="h-full rounded-full" style={{ width: `${alert.riskScore}%`, background: color }} />
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{alert.riskScore}%</span>
      </div>
    </motion.div>
  );
}

export default function InfrastructureHealthPage() {
  const ri = useRoadIntelligence();

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <ShieldAlert size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Infrastructure Health</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">National infrastructure governance score and district health rankings</p>
        </div>
      </motion.div>

      {/* Score Breakdown Strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Resolution Rate", value: `${ri.resolutionRate}%`, color: "text-emerald-400", weight: "40%" },
          { label: "SLA Compliance", value: `${ri.slaCompliance}%`, color: "text-cyan-400", weight: "30%" },
          { label: "Escalation Control", value: `${100 - ri.escalationRatePct}%`, color: "text-amber-400", weight: "20%" },
          { label: "Budget Utilization", value: `${ri.budgetUtilization}%`, color: "text-purple-400", weight: "10%" },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
            <span className="text-[9px] text-[var(--color-text-muted)] opacity-60">Weight: {s.weight}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Health Score + Executive Insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Health Gauge */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <DashboardCard className="p-5 flex flex-col items-center justify-center min-h-[280px]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Infrastructure Health Score</h3>
            <HealthGauge score={ri.infrastructureHealthScore} />
          </DashboardCard>
        </motion.div>

        {/* Executive Insights */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2">
          <DashboardCard className="p-5 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2 mb-1">
              <Brain size={14} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Executive Insights</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ri.insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
            </div>
          </DashboardCard>
        </motion.div>
      </div>

      {/* Budget Efficiency */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <DashboardCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Budget Efficiency</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Budget Requested", value: `₹${ri.totalRequested.toFixed(1)} Cr`, color: "text-cyan-400" },
              { label: "Budget Approved", value: `₹${ri.totalApproved.toFixed(1)} Cr`, color: "text-emerald-400" },
              { label: "Funds Released", value: `₹${ri.totalReleased.toFixed(1)} Cr`, color: "text-amber-400" },
              { label: "Issues Resolved", value: String(ri.issuesResolved), color: "text-teal-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border px-4 py-3 text-center" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </motion.div>

      {/* AI Risk Alerts */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <DashboardCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">AI Risk Alerts</h3>
            <span className="text-[10px] text-[var(--color-text-muted)]">Rule-based priority scoring</span>
          </div>
          <div className="flex flex-col gap-2">
            {ri.aiAlerts.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">No critical alerts — all zones within acceptable risk thresholds</p>
            ) : (
              ri.aiAlerts.map((alert, i) => <AIAlertRow key={i} alert={alert} index={i} />)
            )}
          </div>
        </DashboardCard>
      </motion.div>

      {/* District Health Rankings */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <DashboardCard className="flex flex-col">
          <div className="px-5 pt-4 pb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">District Health Ranking</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Composite score: Resolution Rate (40%) + SLA (30%) + Escalation Control (20%) + Budget (10%)</p>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th className="dashboard-table-th">#</th>
                  <th className="dashboard-table-th">District</th>
                  <th className="dashboard-table-th">State</th>
                  <th className="dashboard-table-th">Health Score</th>
                  <th className="dashboard-table-th">Resolution %</th>
                  <th className="dashboard-table-th">SLA %</th>
                  <th className="dashboard-table-th">Escalation %</th>
                  <th className="dashboard-table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {ri.healthRankings.map((d, i) => (
                  <motion.tr key={d.district} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="dashboard-table-row">
                    <td className="dashboard-table-td text-xs font-bold text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="dashboard-table-td text-xs font-medium text-[var(--color-text-primary)]">{d.district}</td>
                    <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)]">{d.state}</td>
                    <td className="dashboard-table-td">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full overflow-hidden bg-[var(--color-surface)]">
                          <div className="h-full rounded-full" style={{ width: `${d.healthScore}%`, background: STATUS_COLORS[d.status] }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums" style={{ color: STATUS_COLORS[d.status] }}>{d.healthScore}</span>
                      </div>
                    </td>
                    <td className="dashboard-table-td text-xs tabular-nums text-emerald-400">{d.resolutionRate}%</td>
                    <td className="dashboard-table-td text-xs tabular-nums text-cyan-400">{d.slaCompliance}%</td>
                    <td className="dashboard-table-td text-xs tabular-nums text-amber-400">{d.escalationRate}%</td>
                    <td className="dashboard-table-td">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${STATUS_COLORS[d.status]}15`, color: STATUS_COLORS[d.status] }}>
                        {d.status}
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
