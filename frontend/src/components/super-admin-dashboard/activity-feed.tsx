"use client";

import { motion } from "framer-motion";
import { DashboardCard } from "./dashboard-card";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Shield,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ActivityIconVariant =
  | "danger"
  | "success"
  | "info"
  | "amber"
  | "cyan";

interface Activity {
  id: number;
  title: string;
  description: string;
  minutesAgo: number;
  icon: LucideIcon;
  iconVariant: ActivityIconVariant;
}

const activities: Activity[] = [
  {
    id: 1,
    title: "Complaint Escalated",
    description: "NH-48 highway complaint escalated to state review board.",
    minutesAgo: 5,
    icon: AlertTriangle,
    iconVariant: "danger",
  },
  {
    id: 2,
    title: "Contractor Verified",
    description: "L&T Infrastructure cleared verification and compliance checks.",
    minutesAgo: 18,
    icon: CheckCircle2,
    iconVariant: "success",
  },
  {
    id: 3,
    title: "Audit Generated",
    description: "Q2 expenditure audit report published for Maharashtra region.",
    minutesAgo: 42,
    icon: FileText,
    iconVariant: "info",
  },
  {
    id: 4,
    title: "Security Review Triggered",
    description: "Budget anomaly flagged — automated security review initiated.",
    minutesAgo: 68,
    icon: Shield,
    iconVariant: "amber",
  },
  {
    id: 5,
    title: "Admin Request Submitted",
    description: "District officer onboarding request pending super admin approval.",
    minutesAgo: 135,
    icon: UserPlus,
    iconVariant: "cyan",
  },
];

const iconVariantClass: Record<ActivityIconVariant, string> = {
  danger: "activity-timeline-icon-danger",
  success: "activity-timeline-icon-success",
  info: "activity-timeline-icon-info",
  amber: "activity-timeline-icon-amber",
  cyan: "activity-timeline-icon-cyan",
};

function formatRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) {
    return `${minutesAgo} min${minutesAgo === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function ActivityFeed() {
  const router = useRouter();
  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[440px] flex-col p-5 pb-5 xl:min-h-[480px]"
    >
      <div className="activity-feed-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">
            Activity Feed
          </h3>
          <p className="text-muted mt-1 text-xs">Recent platform events</p>
        </div>
        <button type="button" onClick={() => router.push("/super-admin/audit")} className="btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          View All
        </button>
      </div>

      <div className="activity-timeline min-h-0 flex-1">
        <div className="activity-timeline-line" aria-hidden />

        <ul className="activity-timeline-list">
          {activities.map((activity, index) => {
            const Icon = activity.icon;

            return (
              <motion.li
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="activity-timeline-item"
              >
                <div
                  className={`activity-timeline-icon ${iconVariantClass[activity.iconVariant]}`}
                >
                  <Icon size={16} aria-hidden />
                </div>

                <div className="activity-timeline-body">
                  <div className="activity-timeline-meta">
                    <h4 className="activity-timeline-title">{activity.title}</h4>
                    <time
                      className="activity-timeline-time"
                      dateTime={`PT${activity.minutesAgo}M`}
                    >
                      {formatRelativeTime(activity.minutesAgo)}
                    </time>
                  </div>
                  <p className="activity-timeline-desc">{activity.description}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </DashboardCard>
  );
}
