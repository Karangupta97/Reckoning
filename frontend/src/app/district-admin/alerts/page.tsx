"use client";

import { motion } from "framer-motion";
import { Bell, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";

type AlertLevel = "critical" | "warning" | "info" | "resolved";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  level: AlertLevel;
  subDistrict: string;
  time: string;
  read: boolean;
}

const ALERTS: AlertItem[] = [
  { id: "ALT-001", title: "SLA Breach — Mehrauli", description: "ESC-4021 has exceeded the 7-day SLA. Immediate action required.", level: "critical", subDistrict: "Mehrauli", time: "5 min ago", read: false },
  { id: "ALT-002", title: "Escalation Spike Detected", description: "3 new critical escalations in Dwarka in the last 2 hours.", level: "critical", subDistrict: "Dwarka", time: "22 min ago", read: false },
  { id: "ALT-003", title: "SLA Warning — Rohini", description: "2 complaints are 80% through their SLA window in Rohini.", level: "warning", subDistrict: "Rohini", time: "45 min ago", read: false },
  { id: "ALT-004", title: "Officer Inactive Alert", description: "Sub-district officer in Najafgarh has not logged in for 48 hours.", level: "warning", subDistrict: "Najafgarh", time: "2 hr ago", read: true },
  { id: "ALT-005", title: "New Complaint Cluster", description: "Unusual complaint density detected in Vasant Kunj Sector 8.", level: "info", subDistrict: "Vasant Kunj", time: "3 hr ago", read: true },
  { id: "ALT-006", title: "Batch Resolved", description: "12 complaints resolved in Shahdara this morning.", level: "resolved", subDistrict: "Shahdara", time: "4 hr ago", read: true },
];

const levelConfig: Record<AlertLevel, { icon: typeof Bell; iconClass: string; badgeClass: string; label: string }> = {
  critical: { icon: ShieldAlert, iconClass: "activity-timeline-icon-danger", badgeClass: "dashboard-table-badge-risk-critical", label: "Critical" },
  warning: { icon: AlertTriangle, iconClass: "activity-timeline-icon-amber", badgeClass: "dashboard-table-badge-priority-medium", label: "Warning" },
  info: { icon: Info, iconClass: "da-activity-timeline-icon-cyan", badgeClass: "dashboard-table-badge-status-review", label: "Info" },
  resolved: { icon: CheckCircle2, iconClass: "da-activity-timeline-icon-emerald", badgeClass: "dashboard-table-badge-status-resolved", label: "Resolved" },
};

export default function AlertsPage() {
  const unread = ALERTS.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-teal-400 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Alerts</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              District operational alerts · {unread} unread
            </p>
          </div>
        </div>
        <button type="button" className="da-btn-secondary text-xs self-start sm:self-auto">
          Mark all as read
        </button>
      </motion.div>

      <div className="flex flex-col gap-2">
        {ALERTS.map((alert, index) => {
          const { icon: Icon, iconClass, badgeClass, label } = levelConfig[alert.level];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <DashboardCard
                className={`flex items-start gap-3 p-4 transition-colors hover:bg-teal-500/[0.02] ${
                  !alert.read ? "border-l-2 border-l-teal-500/50" : ""
                }`}
              >
                <div className={`activity-timeline-icon mt-0.5 flex-shrink-0 ${iconClass}`}>
                  <Icon size={16} aria-hidden />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${!alert.read ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                        {alert.title}
                      </p>
                      <span className={`dashboard-table-badge ${badgeClass}`}>{label}</span>
                      {!alert.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(20,184,166,0.6)]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
                      {alert.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{alert.description}</p>
                  <p className="mt-1 text-[10px] text-teal-400/80 font-medium">{alert.subDistrict}</p>
                </div>
              </DashboardCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
