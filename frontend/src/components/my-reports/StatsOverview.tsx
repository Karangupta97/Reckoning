"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  MessageCircle,
  Eye,
  Trophy,
  CircleDot,
  Droplets,
  AlertTriangle,
  TrafficCone,
  TreePine,
  CheckCheck,
  ClipboardList,
  XCircle,
} from "lucide-react";
import type { UserStats } from "./types";

/* ─── CountUp Hook ───────────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(eased * target);
      if (current !== start) {
        start = current;
        setValue(current);
      }
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return { value, ref };
}

/* ─── Stat Tile (inline for ticker row) ──────────────────────── */
function StatTile({
  icon,
  value: targetValue,
  label,
  color,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  const { value } = useCountUp(targetValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl bg-[var(--color-surface)] p-3 min-w-[100px] snap-center"
    >
      <span style={{ color }}>{icon}</span>
      <span
        className="text-2xl font-bold font-sans mt-1"
        style={{ color }}
      >
        {value}
      </span>
      <span className="text-[0.7rem] text-[var(--color-text-muted)] mt-0.5">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Circular Progress Gauge ────────────────────────────────── */
function CircularGauge({ percentage }: { percentage: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[var(--color-text-primary)]">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

/* ─── Hazard Bar ─────────────────────────────────────────────── */
const HAZARD_ICONS: Record<string, ReactNode> = {
  pothole: <CircleDot size={14} />,
  flooding: <Droplets size={14} />,
  accident: <AlertTriangle size={14} />,
  signal: <TrafficCone size={14} />,
  debris: <TreePine size={14} />,
};

function HazardBar({
  hazardKey,
  label,
  count,
  total,
}: {
  hazardKey: string;
  label: string;
  count: number;
  total: number;
}) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-5 text-center text-[var(--color-text-muted)]">
        {HAZARD_ICONS[hazardKey] || <CircleDot size={14} />}
      </span>
      <span className="w-16 text-[var(--color-text-secondary)] capitalize truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[var(--color-amber)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        />
      </div>
      <span className="w-8 text-right text-[var(--color-text-muted)]">{count}</span>
    </div>
  );
}

/* ─── Activity Type Icons ────────────────────────────────────── */
const ACTIVITY_ICONS: Record<string, ReactNode> = {
  resolved: <CheckCircle2 size={14} className="text-[var(--color-success)]" />,
  response: <MessageCircle size={14} className="text-[var(--color-info)]" />,
  verified: <CheckCheck size={14} className="text-[var(--color-info)]" />,
  assigned: <ClipboardList size={14} className="text-[var(--color-amber)]" />,
  rejected: <XCircle size={14} className="text-[var(--color-danger)]" />,
};

/* ─── Main StatsOverview Component ───────────────────────────── */
export function StatsOverview({ stats }: { stats: UserStats }) {
  return (
    <div className="sticky top-20 w-[260px] space-y-4 hidden lg:block">
      {/* Card 1 — Personal Stats */}
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow-neu)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-info)] flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Rahul M.</p>
            <p className="text-[0.65rem] text-[var(--color-text-muted)]">Active Citizen</p>
          </div>
        </div>
        <div className="border-t border-[var(--color-border)] pt-3 space-y-2 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText size={13} className="text-[var(--color-text-muted)]" />
              Total Reports
            </span>
            <span className="font-semibold text-[var(--color-text-primary)]">{stats.totalReports}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[var(--color-success)]" />
              Resolved
            </span>
            <span className="font-semibold text-[var(--color-success)]">{stats.resolvedReports} ({stats.resolutionRate}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ThumbsUp size={13} className="text-[var(--color-text-muted)]" />
              Total Upvotes
            </span>
            <span className="font-semibold text-[var(--color-text-primary)]">{stats.totalUpvotes}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MessageCircle size={13} className="text-[var(--color-text-muted)]" />
              Comments
            </span>
            <span className="font-semibold text-[var(--color-text-primary)]">{stats.totalComments}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye size={13} className="text-[var(--color-text-muted)]" />
              Total Views
            </span>
            <span className="font-semibold text-[var(--color-text-primary)]">
              {stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews}
            </span>
          </div>
        </div>
        <div className="border-t border-[var(--color-border)] mt-3 pt-3">
          <p className="text-[0.7rem] text-[var(--color-text-muted)] flex items-center gap-1.5">
            <Trophy size={12} className="text-[var(--color-amber)]" />
            Rank: Top {stats.rankPercentile}% in {stats.rankArea}
          </p>
        </div>
      </div>

      {/* Card 2 — Resolution Rate */}
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow-neu)] p-4">
        <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">Resolution Rate</p>
        <CircularGauge percentage={stats.resolutionRate} />
        <p className="text-[0.7rem] text-[var(--color-text-muted)] text-center mt-2">
          {stats.resolvedReports} of {stats.totalReports} reports resolved
        </p>
      </div>

      {/* Card 3 — Hazard Breakdown */}
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow-neu)] p-4">
        <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">Hazard Breakdown</p>
        <div className="space-y-2">
          {Object.entries(stats.hazardBreakdown).map(([key, count]) => (
            <HazardBar
              key={key}
              hazardKey={key}
              label={key}
              count={count}
              total={stats.totalReports}
            />
          ))}
        </div>
      </div>

      {/* Card 4 — Recent Activity */}
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow-neu)] p-4">
        <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">Recent Activity</p>
        <div className="space-y-3">
          {stats.recentActivity.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5">{ACTIVITY_ICONS[item.type] || <CircleDot size={14} />}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.7rem] text-[var(--color-text-secondary)] leading-tight">
                  {item.text}
                </p>
                <p className="text-[0.6rem] text-[var(--color-text-muted)] mt-0.5">{item.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Stats Ticker Row (mobile/tablet) ───────────────────────── */
export function StatsTicker({ stats }: { stats: UserStats }) {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible">
      <StatTile icon={<FileText size={20} />} value={stats.totalReports} label="Reports" color="var(--color-amber)" />
      <StatTile icon={<Clock size={20} />} value={stats.openReports} label="Active" color="var(--color-info)" />
      <StatTile icon={<CheckCircle2 size={20} />} value={stats.resolvedReports} label="Resolved" color="var(--color-success)" />
      <StatTile icon={<AlertCircle size={20} />} value={stats.criticalReports} label="Critical" color="var(--color-danger)" />
    </div>
  );
}
