"use client";

import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  ThumbsUp,
  MessageCircle,
  Eye,
  Trophy,
  CheckCheck,
  XCircle,
} from "lucide-react";
import type { UserStats, RecentActivityItem } from "./types";
import { ResolutionRing } from "./ResolutionRing";
import { HazardBreakdown } from "./HazardBreakdown";

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/* ─── Activity type configs ─────────────────────────────────────── */
const ACTIVITY_COLORS: Record<RecentActivityItem["type"], string> = {
  resolved: "var(--color-success)",
  response: "var(--color-info)",
  verified: "var(--color-info)",
  assigned: "var(--color-amber)",
  rejected: "var(--color-danger)",
};

const ACTIVITY_ICONS: Record<RecentActivityItem["type"], React.ReactNode> = {
  resolved: <CheckCircle2 size={12} />,
  response: <MessageCircle size={12} />,
  verified: <CheckCheck size={12} />,
  assigned: <FileText size={12} />,
  rejected: <XCircle size={12} />,
};

/* ─── Stat Row ─────────────────────────────────────────────────── */
function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className="flex items-center gap-2 text-xs"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <span style={{ color: "var(--color-text-muted)" }}>{icon}</span>
        {label}
      </span>
      <span
        className="text-xs tabular-nums font-semibold"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-amber)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Props ─────────────────────────────────────────────────── */
interface ReportSidebarProps {
  stats: UserStats;
  userName?: string;
}

/* ─── Main Component ─────────────────────────────────────────── */
export function ReportSidebar({ stats, userName = "Rahul M." }: ReportSidebarProps) {
  const initials = getInitials(userName);

  return (
    <aside className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1 pb-6">
      {/* ── Profile Card ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="neu-card-lg p-5"
      >
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            {/* Amber ring */}
            <div
              className="w-14 h-14 rounded-full p-0.5"
              style={{
                background: "linear-gradient(135deg, var(--color-amber) 0%, #F97316 100%)",
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold"
                style={{
                  background: "var(--color-card)",
                  color: "var(--color-amber)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {initials}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {userName}
            </p>
            {/* Active Citizen badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold mt-1"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-amber) 15%, transparent)",
                color: "var(--color-amber)",
              }}
            >
              Active Citizen
            </span>
          </div>
        </div>

        {/* 5 Stat rows */}
        <div
          className="border-t py-1"
          style={{ borderColor: "var(--color-border)" }}
        >
          <StatRow
            icon={<FileText size={13} />}
            label="Total Reports"
            value={stats.totalReports}
          />
          <StatRow
            icon={<CheckCircle2 size={13} />}
            label="Resolved"
            value={stats.resolvedReports}
          />
          <StatRow
            icon={<ThumbsUp size={13} />}
            label="Upvotes"
            value={formatLargeNumber(stats.totalUpvotes)}
          />
          <StatRow
            icon={<MessageCircle size={13} />}
            label="Comments"
            value={formatLargeNumber(stats.totalComments)}
          />
          <StatRow
            icon={<Eye size={13} />}
            label="Views"
            value={formatLargeNumber(stats.totalViews)}
          />
        </div>

        {/* Rank badge */}
        <div
          className="border-t pt-3 mt-1 flex items-center gap-2"
          style={{ borderColor: "var(--color-border)" }}
        >
          <Trophy size={14} style={{ color: "var(--color-amber)" }} />
          <span
            className="text-[0.7rem]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Top {stats.rankPercentile}% in India
          </span>
        </div>
      </motion.div>

      {/* ── Resolution Rate Card ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="neu-card-lg p-5"
      >
        <p
          className="text-xs font-semibold mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          Resolution Rate
        </p>
        <ResolutionRing
          percentage={stats.resolutionRate}
          resolved={stats.resolvedReports}
          total={stats.totalReports}
        />
      </motion.div>

      {/* ── Hazard Breakdown Card ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.14 }}
        className="neu-card-lg p-5"
      >
        <p
          className="text-xs font-semibold mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          Hazard Breakdown
        </p>
        <HazardBreakdown breakdown={stats.hazardBreakdown} total={stats.totalReports} />
      </motion.div>

      {/* ── Recent Activity Card ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="neu-card-lg p-5"
      >
        <p
          className="text-xs font-semibold mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          Recent Activity
        </p>

        {stats.recentActivity.length === 0 ? (
          <p
            className="text-xs text-center py-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            No activity yet
          </p>
        ) : (
          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute left-[7px] top-4 bottom-4 w-px"
              style={{ backgroundColor: "var(--color-border)" }}
            />

            <div className="space-y-4">
              {stats.recentActivity.slice(0, 5).map((item, i) => {
                const color = ACTIVITY_COLORS[item.type];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="flex gap-3 items-start relative"
                  >
                    {/* Dot */}
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center relative z-10"
                      style={{ backgroundColor: color }}
                    >
                      <span className="text-white scale-75">{ACTIVITY_ICONS[item.type]}</span>
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs leading-snug"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {item.text}
                      </p>
                      <p
                        className="text-[0.65rem] mt-0.5 tabular-nums"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {item.timeAgo}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </aside>
  );
}
