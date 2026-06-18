"use client";

import { motion } from "framer-motion";
import { Bell, AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2, Brain, Zap, BarChart3 } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import RiskAlerts from "@/components/super-admin-dashboard/risk-alerts";
import { useRoadIntelligence } from "@/hooks/use-road-intelligence";

const ALERTS = [
  { id: "ALT-001", type: "Budget Anomaly",       project: "NH-48 Highway Expansion",   state: "Maharashtra", severity: "Critical", time: "3 min ago",  resolved: false },
  { id: "ALT-002", type: "Quality Degradation",  project: "PMGSY Bihar Package-22",    state: "Bihar",       severity: "High",     time: "18 min ago", resolved: false },
  { id: "ALT-003", type: "Contractor Risk Spike",project: "SH-17 Rehab Project",       state: "Karnataka",   severity: "High",     time: "42 min ago", resolved: false },
  { id: "ALT-004", type: "SLA Breach Predicted", project: "Rural Connectivity UP-31",  state: "Uttar Pradesh",severity: "Medium",  time: "1 hr ago",   resolved: false },
  { id: "ALT-005", type: "GIS Anomaly",          project: "ODR Phase-III Package",     state: "Odisha",      severity: "Medium",   time: "2 hr ago",   resolved: true  },
  { id: "ALT-006", type: "Budget Anomaly",       project: "Urban Road Repair",         state: "Delhi",       severity: "Low",      time: "4 hr ago",   resolved: true  },
];

const severityBadge: Record<string, string> = {
  Critical: "dashboard-table-badge-status-open",
  High:     "dashboard-table-badge-status-escalated",
  Medium:   "dashboard-table-badge-status-review",
  Low:      "dashboard-table-badge-status-resolved",
};

export default function AIAlertsPage() {
  const ri = useRoadIntelligence();

  // AI-derived insights from live store data
  const aiInsights = [
    ri.districtRisks[0] ? `${ri.districtRisks[0].district} shows ${ri.districtRisks[0].complaints * 5 > 50 ? "critical" : "elevated"} complaint density (${ri.districtRisks[0].complaints} active cases)` : null,
    ri.slaCompliance < 70 ? `SLA compliance at ${ri.slaCompliance}% — below governance threshold. Immediate intervention recommended.` : null,
    ri.districtRisks.filter(d => d.breaches > 0).length > 1 ? `Multi-district SLA breach pattern detected (${ri.districtRisks.filter(d => d.breaches > 0).length} districts affected)` : null,
    ri.totalRequested > 0 && ri.totalApproved === 0 ? `Budget approval delay: ₹${ri.totalRequested.toFixed(1)} Cr requested, ₹0 approved — pipeline stalled` : null,
    ri.escalationRatePct > 60 ? `High escalation-to-complaint ratio (${ri.escalationRatePct}%) suggests systemic sub-district capacity issues` : null,
    ri.resolutionVelocity < 40 ? `Resolution momentum critically low (${ri.resolutionVelocity}%) — governance backlog forming` : null,
    `Infrastructure Health Score: ${ri.infrastructureHealthScore}/100 — ${ri.infrastructureHealthScore >= 70 ? "within acceptable range" : "requires attention"}`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Bell size={20} className="text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">AI Alerts</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Machine-learning detected anomalies across infrastructure projects</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Alerts",  value: String(ALERTS.filter(a => !a.resolved).length), color: "text-red-400"     },
          { label: "Critical",       value: String(ALERTS.filter(a => a.severity === "Critical").length), color: "text-orange-400"  },
          { label: "Resolved Today", value: String(ALERTS.filter(a => a.resolved).length),  color: "text-emerald-400" },
          { label: "Projects at Risk",value: "18",                                           color: "text-amber-400"  },
        ].map((s) => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <RiskAlerts />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <DashboardCard className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">All Alerts</h3>
            <div className="flex flex-col gap-2">
              {ALERTS.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", opacity: a.resolved ? 0.6 : 1 }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {a.resolved ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={14} className="text-red-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{a.type}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">{a.project} · {a.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`dashboard-table-badge ${severityBadge[a.severity]}`}>{a.severity}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">{a.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </DashboardCard>
        </motion.div>
      </div>

      {/* AI Predictive Insights — derived from live governance data */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <DashboardCard className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={14} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">AI Predictive Insights</h3>
            <span className="text-[9px] text-[var(--color-text-muted)] ml-auto">Rule-based analysis</span>
          </div>
          <div className="flex flex-col gap-2">
            {aiInsights.map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5"
                style={{ borderColor: "rgba(34,211,238,0.2)", background: "rgba(34,211,238,0.03)" }}>
                <Zap size={12} className="text-cyan-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </DashboardCard>
      </motion.div>

      {/* AI Risk Alerts from Road Intelligence */}
      {ri.aiAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <DashboardCard className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-orange-400" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">District Risk Forecast</h3>
            </div>
            <div className="flex flex-col gap-2">
              {ri.aiAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2"
                  style={{ borderColor: alert.priority === "High" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)", background: alert.priority === "High" ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)" }}>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{alert.corridor}, {alert.state}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{alert.reason}</p>
                  </div>
                  <span className="text-xs font-bold tabular-nums shrink-0 ml-2" style={{ color: alert.priority === "High" ? "#ef4444" : "#f59e0b" }}>{alert.riskScore}%</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        </motion.div>
      )}
    </div>
  );
}
