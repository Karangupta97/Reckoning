"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ClipboardList,
  FileText,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminNotification, AdminNotificationType } from "@/store/adminNotificationStore";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";

type IconVariant = "teal" | "emerald" | "cyan" | "danger" | "amber";

const iconVariantClass: Record<IconVariant, string> = {
  teal: "da-activity-timeline-icon-teal",
  emerald: "da-activity-timeline-icon-emerald",
  cyan: "da-activity-timeline-icon-cyan",
  danger: "activity-timeline-icon-danger",
  amber: "activity-timeline-icon-amber",
};

function iconForType(type: AdminNotificationType): { icon: LucideIcon; variant: IconVariant } {
  switch (type) {
    case "escalation_new":
    case "escalation_escalated":
      return { icon: ShieldAlert, variant: "danger" };
    case "resolution_submitted":
    case "resolution_decision":
      return { icon: CheckCircle2, variant: "emerald" };
    case "ticket_submitted":
      return { icon: ClipboardList, variant: "cyan" };
    case "evidence_submitted":
    case "evidence_decision":
      return { icon: FileText, variant: "teal" };
    case "clarification_request":
      return { icon: AlertTriangle, variant: "amber" };
    case "budget_decision":
    case "budget_submitted":
      return { icon: IndianRupee, variant: "amber" };
    default:
      return { icon: UserCheck, variant: "teal" };
  }
}

/** Check if a notification is budget-related */
function isBudgetType(type: AdminNotificationType): boolean {
  return type === "budget_decision" || type === "budget_submitted";
}

function ActivityFeedContent({ activities }: { activities: AdminNotification[] }) {
  const router = useRouter();
  const budgetRequests = useBudgetApprovalStore((s) => s.requests);

  // Build a quick lookup for budget project names
  const budgetMap = useMemo(() => {
    const m = new Map<string, { project: string; status: string }>();
    for (const r of budgetRequests) {
      m.set(r.id, { project: r.project, status: r.status });
    }
    return m;
  }, [budgetRequests]);

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col p-5"
    >
      <div className="activity-feed-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">
            Operations Feed
          </h3>
          <p className="text-muted mt-1 text-xs">Real-time district activity</p>
        </div>
        <button type="button" onClick={() => router.push("/district-admin/dashboard/escalation")} className="da-btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          View All
        </button>
      </div>

      <div className="activity-timeline min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "color-mix(in srgb, var(--da-teal) 25%, transparent) transparent" }}>
        <div
          className="activity-timeline-line da-activity-timeline-line"
          aria-hidden
        />

        <ul className="activity-timeline-list">
          {activities.length === 0 ? (
            <li className="text-xs text-[var(--color-text-muted)] py-4">No recent activity</li>
          ) : (
            activities.map((activity, index) => {
              const { icon: Icon, variant } = iconForType(activity.type);
              const isBudget = isBudgetType(activity.type);
              const budgetInfo = isBudget ? budgetMap.get(activity.entityId) : null;

              return (
                <motion.li
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="activity-timeline-item"
                >
                  <div
                    className={`activity-timeline-icon ${iconVariantClass[variant]}`}
                  >
                    <Icon size={16} aria-hidden />
                  </div>

                  <div className="activity-timeline-body">
                    <div className="activity-timeline-meta">
                      <h4 className="activity-timeline-title">{activity.title}</h4>
                      <time className="activity-timeline-time">{activity.timestamp}</time>
                    </div>

                    {/* Budget-specific context-rich display */}
                    {isBudget && budgetInfo ? (
                      <div className="mt-0.5">
                        <p className="text-[11px] font-mono font-semibold">
                          <button type="button" onClick={() => router.push(activity.href)}
                            className="hover:underline transition-colors" style={{ color: "var(--da-teal)" }}>
                            {activity.entityId}
                          </button>
                          <span className="text-[var(--color-text-secondary)] font-sans font-normal"> • {budgetInfo.project}</span>
                        </p>
                        <p className="activity-timeline-desc mt-0.5">{activity.message}</p>
                        <button
                          type="button"
                          onClick={() => router.push(activity.href)}
                          className="flex items-center gap-1 mt-1 text-[10px] font-semibold transition-colors hover:underline"
                          style={{ color: "var(--da-teal)" }}
                        >
                          View Request <ArrowRight size={10} />
                        </button>
                      </div>
                    ) : (
                      <p className="activity-timeline-desc">
                        {activity.entityId && (
                          <button
                            type="button"
                            onClick={() => router.push(activity.href)}
                            className="font-mono font-semibold mr-1 hover:underline transition-colors"
                            style={{ color: "var(--da-teal)" }}
                          >
                            {activity.entityId}
                          </button>
                        )}
                        {activity.message}
                        {activity.href && (
                          <button
                            type="button"
                            onClick={() => router.push(activity.href)}
                            className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold transition-colors hover:underline"
                            style={{ color: "var(--da-teal)" }}
                          >
                            View <ArrowRight size={9} />
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                </motion.li>
              );
            })
          )}
        </ul>
      </div>
    </DashboardCard>
  );
}

export default function DistrictActivityFeed() {
  const allNotifications = useAdminNotifications();
  const activities = useMemo(
    () => allNotifications.filter((x) => x.portal === "district").slice(0, 8),
    [allNotifications]
  );

  return <ActivityFeedContent activities={activities} />;
}
