"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Droplets, Trash2, Lightbulb } from "lucide-react";
import type { RecentActivityItem } from "@/components/my-reports/types";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

interface RecentActivityProps {
  activities: RecentActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({ activities, isLoading = false }: RecentActivityProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.recentActivity");

  const ACTIVITIES = activities.slice(0, 6).map((item) => {
    const icon = item.type === "resolved"
      ? Trash2
      : item.type === "verified"
        ? AlertTriangle
        : item.type === "assigned"
          ? Droplets
          : item.type === "rejected"
            ? Lightbulb
            : AlertTriangle;

    const color = item.type === "resolved"
      ? "var(--color-success)"
      : item.type === "rejected"
        ? "var(--color-danger)"
        : "var(--color-info)";

    return {
      icon,
      color,
      title: item.text,
      subtitle: item.type,
      time: item.timeAgo,
    };
  });

  return (
    <div className="neu-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h3>
        <button
          onClick={() => router.push("/dashboard/my-reports")}
          className="text-xs font-medium text-[var(--color-amber)] hover:underline"
        >
          {t("viewAll")}
        </button>
      </div>

      <motion.ul
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3 flex-1"
      >
        {ACTIVITIES.map((activity, i) => {
          const Icon = activity.icon;
          return (
            <motion.li
              key={i}
              variants={itemVariants}
              className="flex items-start gap-3 group"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: `color-mix(in srgb, ${activity.color} 15%, transparent)`,
                  color: activity.color,
                }}
              >
                <Icon size={15} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {activity.title}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {activity.subtitle}
                </p>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap flex items-center gap-1">
                {activity.time}
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: activity.color }}
                />
              </span>
            </motion.li>
          );
        })}
        {!isLoading && ACTIVITIES.length === 0 && (
          <li className="text-xs text-[var(--color-text-muted)]">No recent activity yet.</li>
        )}
      </motion.ul>
    </div>
  );
}
