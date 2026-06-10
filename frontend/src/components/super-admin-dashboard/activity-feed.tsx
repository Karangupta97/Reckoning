"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardCard } from "./dashboard-card";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Shield,
  IndianRupee,
  Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuditLogStore } from "@/store/auditLogStore";

const CAT_ICON: Record<string, LucideIcon> = {
  Escalations: AlertTriangle,
  "Budget Decisions": IndianRupee,
  "Evidence Decisions": Camera,
  "Approval Actions": CheckCircle2,
  "User Actions": Shield,
};

const CAT_VARIANT: Record<string, string> = {
  Escalations: "activity-timeline-icon-danger",
  "Budget Decisions": "activity-timeline-icon-amber",
  "Evidence Decisions": "activity-timeline-icon-cyan",
  "Approval Actions": "activity-timeline-icon-success",
  "User Actions": "activity-timeline-icon-info",
};

export default function ActivityFeed() {
  const entries = useAuditLogStore((s) => s.entries).slice(0, 6);

  return (
    <DashboardCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[440px] flex-col p-5 pb-5 xl:min-h-[480px]"
    >
      <div className="activity-feed-header">
        <div>
          <h3 className="text-primary text-sm font-semibold lg:text-base">Activity Feed</h3>
          <p className="text-muted mt-1 text-xs">Live workflow events from shared state</p>
        </div>
        <Link href="/super-admin/audit" className="btn-secondary shrink-0 !h-9 !px-3 !text-xs">
          View All
        </Link>
      </div>

      <div className="activity-timeline min-h-0 flex-1">
        <div className="activity-timeline-line" aria-hidden />
        <ul className="activity-timeline-list">
          {entries.map((entry, index) => {
            const Icon = CAT_ICON[entry.category] ?? FileText;
            const variant = CAT_VARIANT[entry.category] ?? "activity-timeline-icon-info";
            return (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="activity-timeline-item"
              >
                <div className={`activity-timeline-icon ${variant}`}>
                  <Icon size={16} aria-hidden />
                </div>
                <div className="activity-timeline-body">
                  <div className="activity-timeline-meta">
                    <h4 className="activity-timeline-title">{entry.action}</h4>
                    <time className="activity-timeline-time">{entry.timestamp}</time>
                  </div>
                  <p className="activity-timeline-desc">
                    {entry.entityId} · {entry.actor} · {entry.newStatus}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </DashboardCard>
  );
}
