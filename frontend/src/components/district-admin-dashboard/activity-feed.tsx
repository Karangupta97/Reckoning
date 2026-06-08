"use client";

import { motion } from "framer-motion";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Map,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type IconVariant = "teal" | "emerald" | "cyan" | "danger" | "amber";

interface Activity {
  id: number;
  title: string;
  description: string;
  minutesAgo: number;
  icon: LucideIcon;
  iconVariant: IconVariant;
}

const activities: Activity[] = [
  {
    id: 1,
    title: "Escalation Raised",
    description: "Sewage overflow — Mehrauli Ward 12 escalated to district review.",
    minutesAgo: 4,
    icon: ShieldAlert,
    iconVariant: "danger",
  },
  {
    id: 2,
    title: "Complaint Resolved",
    description: "Road pothole cluster — Dwarka Sector 10 marked resolved by field officer.",
    minutesAgo: 18,
    icon: CheckCircle2,
    iconVariant: "emerald",
  },
  {
    id: 3,
    title: "SLA Breach Warning",
    description: "3 complaints approaching SLA deadline in Rohini sub-district.",
    minutesAgo: 35,
    icon: AlertTriangle,
    iconVariant: "amber",
  },
  {
    id: 4,
    title: "Officer Field Update",
    description: "Vasant Kunj inspector submitted field verification for ESC-4023.",
    minutesAgo: 62,
    icon: UserCheck,
    iconVariant: "teal",
  },
  {
    id: 5,
    title: "Map Hotspot Detected",
    description: "New complaint cluster detected in Najafgarh — auto-flagged for review.",
    minutesAgo: 120,
    icon: Map,
    iconVariant: "cyan",
  },
];

const iconVariantClass: Record<IconVariant, string> = {
  teal: "da-activity-timeline-icon-teal",
  emerald: "da-activity-timeline-icon-emerald",
  cyan: "da-activity-timeline-icon-cyan",
  danger: "activity-timeline-icon-danger",
  amber: "activity-timeline-icon-amber",
};

function formatRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo} min${minutesAgo === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DistrictActivityFeed() {
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
        <button type="button" className="da-btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          View All
        </button>
      </div>

      <div className="activity-timeline min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "color-mix(in srgb, var(--da-teal) 25%, transparent) transparent" }}>
        <div
          className="activity-timeline-line da-activity-timeline-line"
          aria-hidden
        />

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
