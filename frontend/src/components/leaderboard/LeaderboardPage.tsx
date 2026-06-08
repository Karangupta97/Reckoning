"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, TrendingUp, TrendingDown, Minus, BadgeCheck, Star,
  ChevronRight, X, Globe2, MapPin, Map, Shield, Building,
  Activity, Zap, Flame, Users, CheckCircle, AlertTriangle,
  Wrench, Landmark, Gift, RefreshCw, Info,
  ArrowUpRight, ClipboardList, Clock,
} from "lucide-react";
import {
  CITIZEN_LEADERBOARD,
  ADMIN_LEADERBOARD,
  GLOBAL_STATS,
  LEADERBOARD_CHALLENGES,
  STREAK_DATA,
  type CitizenEntry,
  type AdminEntry,
  type LeaderboardView,
  type LeaderboardScope,
  type TimeFilter,
} from "./mockData";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AnyEntry = CitizenEntry | AdminEntry;

function isCitizen(e: AnyEntry): e is CitizenEntry {
  return "points" in e;
}

// ─── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const listItem = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPE_TABS: { key: LeaderboardScope; label: string; icon: React.ElementType }[] = [
  { key: "global", label: "Global", icon: Globe2 },
  { key: "district", label: "District", icon: Map },
  { key: "sub-district", label: "Sub-District", icon: MapPin },
];

const VIEW_TABS: { key: LeaderboardView; label: string; icon: React.ElementType }[] = [
  { key: "citizen", label: "Citizen", icon: Users },
  { key: "sub-district-admin", label: "Sub-District Admin", icon: Shield },
  { key: "district-admin", label: "District Admin", icon: Building },
];

const TIME_OPTIONS: { key: TimeFilter; label: string }[] = [
  { key: "all-time", label: "All Time" },
  { key: "this-month", label: "This Month" },
  { key: "this-week", label: "This Week" },
];

const MEDAL_CONFIGS = [
  {
    medal: "🥇",
    gradient: "linear-gradient(145deg, #F59E0B, #B45309)",
    shadow: "0 8px 32px rgba(245,158,11,0.45)",
    border: "#F59E0B",
    glow: "rgba(245,158,11,0.25)",
    label: "1st Place",
    reward: "1,000",
    heightClass: "h-20 sm:h-24",
    order: 1,
    isFirst: true,
  },
  {
    medal: "🥈",
    gradient: "linear-gradient(145deg, #CBD5E1, #64748B)",
    shadow: "0 6px 24px rgba(148,163,184,0.4)",
    border: "#94A3B8",
    glow: "rgba(148,163,184,0.2)",
    label: "2nd Place",
    reward: "500",
    heightClass: "h-14 sm:h-20",
    order: 0,
    isFirst: false,
  },
  {
    medal: "🥉",
    gradient: "linear-gradient(145deg, #CD7F32, #92400E)",
    shadow: "0 6px 24px rgba(205,127,50,0.35)",
    border: "#CD7F32",
    glow: "rgba(205,127,50,0.2)",
    label: "3rd Place",
    reward: "250",
    heightClass: "h-10 sm:h-16",
    order: 2,
    isFirst: false,
  },
];

const PAGE_SIZE = 20;

// ─── Rank Trend Icon ──────────────────────────────────────────────────────────

function RankTrend({ current, prev }: { current: number; prev: number }) {
  const diff = prev - current;
  if (diff > 0)
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "var(--color-success)" }} aria-label={`Up ${diff} positions`}>
        <TrendingUp size={11} strokeWidth={2.5} />
        {diff}
      </span>
    );
  if (diff < 0)
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "var(--color-danger)" }} aria-label={`Down ${Math.abs(diff)} positions`}>
        <TrendingDown size={11} strokeWidth={2.5} />
        {Math.abs(diff)}
      </span>
    );
  return <Minus size={11} strokeWidth={2} className="opacity-40" aria-label="No change" />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  initial, color, size = "md", isCurrentUser = false,
}: { initial: string; color: string; size?: "sm" | "md" | "lg" | "xl"; isCurrentUser?: boolean }) {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-xl" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 relative`}
      style={{
        background: color,
        boxShadow: isCurrentUser ? `0 0 0 2px var(--color-amber), 0 0 12px rgba(245,158,11,0.3)` : undefined,
      }}
      aria-hidden="true"
    >
      {initial}
      {isCurrentUser && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-[var(--color-card)]" />
      )}
    </div>
  );
}

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({
  entry, config, onSelect,
}: { entry: AnyEntry; config: (typeof MEDAL_CONFIGS)[number]; onSelect: (e: AnyEntry) => void }) {
  const name = entry.name;
  const primaryMetric = isCitizen(entry) ? `${entry.points.toLocaleString()} XP` : `${entry.issuesResolved} Resolved`;
  const isFirst = config.isFirst;

  return (
    <motion.button
      initial={{ opacity: 0, y: isFirst ? -20 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: config.order * 0.1 }}
      onClick={() => onSelect(entry)}
      className="flex flex-col items-center flex-1 max-w-[140px] focus:outline-none group"
      aria-label={`${config.label}: ${name} – ${primaryMetric}. Tap for details.`}
    >
      {/* Glow ring */}
      <div className="relative">
        <div
          className={`absolute inset-0 rounded-full blur-lg opacity-60 group-hover:opacity-90 transition-opacity`}
          style={{ background: config.glow }}
        />
        <div
          className={`relative rounded-full flex items-center justify-center text-white font-bold border-2 transition-transform group-hover:scale-105 ${isFirst ? "w-16 h-16 sm:w-20 sm:h-20 text-lg sm:text-2xl" : "w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base"}`}
          style={{ background: entry.avatarColor, borderColor: config.border, boxShadow: config.shadow }}
        >
          {entry.initial}
        </div>
        <span className={`absolute -top-1 -right-1 ${isFirst ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>{config.medal}</span>
      </div>

      {/* Name */}
      <div className="mt-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className={`font-semibold truncate max-w-[100px] text-[var(--color-text-primary)] ${isFirst ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}>
            {name}
          </span>
          {isCitizen(entry) && entry.isVerifiedUser && (
            <BadgeCheck size={12} style={{ color: "var(--color-info)" }} aria-label="Verified user" />
          )}
        </div>
        <span className={`font-bold block ${isFirst ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`} style={{ color: config.border }}>
          {primaryMetric}
        </span>
      </div>

      {/* Reward badge */}
      <div
        className="mt-1.5 px-2.5 py-1 rounded-full flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold border"
        style={{
          background: `color-mix(in srgb, ${config.border} 12%, transparent)`,
          borderColor: `color-mix(in srgb, ${config.border} 35%, transparent)`,
          color: config.border,
        }}
        aria-label={`Reward: ${config.reward} XP`}
      >
        <Gift size={9} />
        {config.reward} XP
      </div>

      {/* Podium bar */}
      <div
        className={`w-full ${config.heightClass} rounded-t-xl mt-2 border border-b-0 transition-all`}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${config.border} 18%, transparent), var(--color-surface))`,
          borderColor: `color-mix(in srgb, ${config.border} 30%, transparent)`,
        }}
      />
    </motion.button>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function ListRow({
  entry, view, onSelect, index,
}: { entry: AnyEntry; view: LeaderboardView; onSelect: (e: AnyEntry) => void; index: number }) {
  const isCurrentUser = entry.isCurrentUser;
  const rankDiff = entry.prevRank - entry.rank;

  return (
    <motion.button
      variants={listItem}
      onClick={() => onSelect(entry)}
      className={`w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all duration-200 text-left group ${
        isCurrentUser
          ? "border-amber-400/40 bg-amber-50/60 dark:bg-amber-400/8"
          : "border-[var(--color-border)] hover:border-[var(--color-info)]/30 hover:bg-[var(--color-surface)]"
      }`}
      style={isCurrentUser ? { boxShadow: "0 0 0 1px rgba(245,158,11,0.2), 0 2px 12px rgba(245,158,11,0.08)" } : undefined}
      aria-label={`${entry.name}, Rank ${entry.rank}. Tap for details.`}
    >
      {/* Rank number */}
      <div className="w-8 flex flex-col items-center flex-shrink-0">
        <span
          className="text-xs sm:text-sm font-bold tabular-nums leading-none"
          style={{ color: isCurrentUser ? "var(--color-amber)" : "var(--color-text-muted)" }}
        >
          {entry.rank}
        </span>
        <RankTrend current={entry.rank} prev={entry.prevRank} />
      </div>

      {/* Avatar */}
      <Avatar initial={entry.initial} color={entry.avatarColor} size="md" isCurrentUser={isCurrentUser} />

      {/* Name & meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-xs sm:text-sm font-semibold truncate"
            style={{ color: isCurrentUser ? "var(--color-amber)" : "var(--color-text-primary)" }}
          >
            {entry.name}
            {isCurrentUser && <span className="text-[10px] ml-1 font-normal opacity-70">(You)</span>}
          </span>
          {isCitizen(entry) && entry.isVerifiedUser && (
            <BadgeCheck size={13} style={{ color: "var(--color-info)" }} aria-label="Verified user" />
          )}
        </div>
        {/* Sub-row */}
        {view === "citizen" && isCitizen(entry) && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[var(--color-text-muted)]">{entry.district}</span>
            <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline">· {entry.reports} reports</span>
          </div>
        )}
        {view !== "citizen" && !isCitizen(entry) && (
          <span className="text-[10px] text-[var(--color-text-muted)]">{entry.district} · {entry.role}</span>
        )}
      </div>

      {/* Core metric */}
      <div className="flex flex-col items-end flex-shrink-0">
        {view === "citizen" && isCitizen(entry) ? (
          <>
            <span className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: "var(--color-amber)" }}>
              {entry.points.toLocaleString()} XP
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums hidden sm:block">
              Rep: {entry.reputation}
            </span>
          </>
        ) : !isCitizen(entry) ? (
          <>
            <span className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: "var(--color-success)" }}>
              {entry.issuesResolved} solved
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums hidden sm:block">
              {entry.validationAccuracy}% acc.
            </span>
          </>
        ) : null}
      </div>

      {/* Verified + chevron */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <ChevronRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-info)] transition-colors" aria-hidden="true" />
      </div>
    </motion.button>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ entry, view, onClose }: { entry: AnyEntry; view: LeaderboardView; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const rankConfig = MEDAL_CONFIGS.find((_, i) => i === entry.rank - 1) ?? null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${entry.name}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)]"
          style={{ background: "var(--color-card)" }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between p-4 sm:p-5 border-b border-[var(--color-border)]" style={{ background: "var(--color-card)" }}>
            <div className="flex items-center gap-3">
              <Avatar initial={entry.initial} color={entry.avatarColor} size="lg" isCurrentUser={entry.isCurrentUser} />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">{entry.name}</h2>
                  {isCitizen(entry) && entry.isVerifiedUser && (
                    <BadgeCheck size={15} style={{ color: "var(--color-info)" }} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "color-mix(in srgb, var(--color-amber) 15%, transparent)", color: "var(--color-amber)" }}
                  >
                    Rank #{entry.rank}
                  </span>
                  {!isCitizen(entry) && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">{entry.role}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
              aria-label="Close details"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            {isCitizen(entry) ? (
              <>
                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <MetricChip label="Total Points" value={entry.points.toLocaleString()} icon={<Trophy size={14} color="#F59E0B" />} />
                  <MetricChip label="Reputation" value={`${entry.reputation}/100`} icon={<Star size={14} color="#22C55E" />} />
                  <MetricChip label="Impact Score" value={`${entry.impactScore}/100`} icon={<Zap size={14} color="#3B82F6" />} />
                </div>

                {/* Performance breakdown */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Performance Breakdown</h3>
                  <div className="space-y-2">
                    <PerfRow icon={<ClipboardList size={13} color="#3B82F6" />} label="Reports Submitted" value={entry.totalReports} />
                    <PerfRow icon={<CheckCircle size={13} color="#22C55E" />} label="Verified Reports" value={entry.validationCount} />
                    <PerfRow icon={<Wrench size={13} color="#F59E0B" />} label="Hazards Resolved" value={Math.floor(entry.reports * 0.35)} />
                    <PerfRow icon={<X size={13} color="#EF4444" />} label="Rejections" value={entry.rejections} negative />
                    <PerfRow icon={<AlertTriangle size={13} color="#F97316" />} label="High Risk Reports" value={entry.highRiskReports} />
                    <PerfRow icon={<Landmark size={13} color="#8B5CF6" />} label="Authority Actions Triggered" value={entry.authorityActionsTriggered} />
                  </div>
                </div>

                {/* Impact created */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Impact Created</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <ImpactChip icon={<Users size={13} color="#22C55E" />} label="Lives Impacted" value={entry.livesImpacted.toLocaleString()} />
                    <ImpactChip icon={<Map size={13} color="#3B82F6" />} label="Roads Improved" value={`${entry.roadsImproved} km`} />
                    <ImpactChip icon={<Landmark size={13} color="#8B5CF6" />} label="Authorities Notified" value={entry.authoritiesNotified} />
                    <ImpactChip icon={<Users size={13} color="#F59E0B" />} label="Communities Helped" value={Math.floor(entry.authoritiesNotified * 0.09)} />
                  </div>
                </div>

                {/* Recent achievements */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Recent Achievements</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {entry.recentAchievements.map((ach, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, var(--color-amber) 15%, transparent)" }}>
                          <Trophy size={14} color="#F59E0B" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-[var(--color-text-primary)] truncate">{ach.name}</p>
                          <p className="text-[9px] text-[var(--color-text-muted)]">{ach.timeAgo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Badges</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.badges.map((b, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-full font-medium border" style={{ background: "color-mix(in srgb, var(--color-info) 10%, transparent)", borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)", color: "var(--color-info)" }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Admin metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricChip label="Issues Resolved" value={entry.issuesResolved} icon={<CheckCircle size={14} color="#22C55E" />} />
                  <MetricChip label="Avg Resolution" value={entry.avgResolutionTime} icon={<Clock size={14} color="#3B82F6" />} />
                  <MetricChip label="Validation Acc." value={`${entry.validationAccuracy}%`} icon={<Activity size={14} color="#F59E0B" />} />
                  <MetricChip label="Citizen Rating" value={`${entry.citizenRating.toFixed(1)}/5`} icon={<Star size={14} color="#8B5CF6" />} />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">Activity Breakdown</h3>
                  <div className="space-y-2">
                    <PerfRow icon={<ClipboardList size={13} color="#3B82F6" />} label="Total Tickets" value={entry.totalTickets} />
                    <PerfRow icon={<ArrowUpRight size={13} color="#F59E0B" />} label="Escalations Handled" value={entry.escalations} />
                    <PerfRow icon={<CheckCircle size={13} color="#22C55E" />} label="Response Rate" value={`${entry.responseRate}%`} />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Jurisdiction</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full border font-medium" style={{ background: "color-mix(in srgb, var(--color-success) 10%, transparent)", borderColor: "color-mix(in srgb, var(--color-success) 30%, transparent)", color: "var(--color-success)" }}>
                      {entry.district}
                    </span>
                    {entry.subDistrict && (
                      <span className="text-xs px-2.5 py-1 rounded-full border font-medium" style={{ background: "color-mix(in srgb, var(--color-info) 10%, transparent)", borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)", color: "var(--color-info)" }}>
                        {entry.subDistrict}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Small helper sub-components ─────────────────────────────────────────────

function MetricChip({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-1">
      <div className="flex items-center gap-1.5">{icon}<span className="text-[10px] text-[var(--color-text-muted)]">{label}</span></div>
      <span className="text-sm font-bold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

function PerfRow({ icon, label, value, negative = false }: { icon: React.ReactNode; label: string; value: string | number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">{icon}{label}</div>
      <span className={`text-xs font-semibold tabular-nums ${negative ? "text-[var(--color-danger)]" : "text-[var(--color-text-primary)]"}`}>{value}</span>
    </div>
  );
}

function ImpactChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      {icon}
      <div className="min-w-0">
        <p className="text-[9px] text-[var(--color-text-muted)]">{label}</p>
        <p className="text-xs font-semibold text-[var(--color-text-primary)]">{value}</p>
      </div>
    </div>
  );
}

// ─── Sidebar: Global Stats ────────────────────────────────────────────────────

function GlobalStatsSidebar() {
  return (
    <div className="space-y-4">
      {/* Global Impact card */}
      <div className="neu-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-info) 15%, transparent)" }}>
            <Globe2 size={15} color="var(--color-info)" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Global Impact</h3>
        </div>
        <div className="space-y-2.5">
          {[
            { label: "Citizens Active", value: GLOBAL_STATS.citizensActive, color: "#3B82F6" },
            { label: "Reports Submitted", value: GLOBAL_STATS.reportsSubmitted, color: "#22C55E" },
            { label: "Hazards Resolved", value: GLOBAL_STATS.hazardsResolved, color: "#F59E0B" },
            { label: "Lives Impacted", value: GLOBAL_STATS.livesImpacted, color: "#EF4444" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-[var(--color-text-secondary)]">{s.label}</span>
              </div>
              <span className="text-xs font-bold tabular-nums text-[var(--color-text-primary)]">{s.value}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-surface)] transition-colors" style={{ color: "var(--color-info)" }}>
          View Full Impact
        </button>
      </div>

      {/* Current Challenges */}
      <div className="neu-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, #EF4444 15%, transparent)" }}>
            <Zap size={15} color="#EF4444" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Current Challenges</h3>
        </div>
        <div className="space-y-3">
          {LEADERBOARD_CHALLENGES.map((ch) => (
            <div key={ch.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">{ch.title}</span>
                <Gift size={12} color="#F59E0B" />
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(ch.progress / ch.total) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--color-info), var(--color-success))" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--color-text-muted)]">{ch.progress} / {ch.total}</span>
                <span className="text-[10px] font-semibold" style={{ color: "var(--color-amber)" }}>+{ch.reward} XP</span>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-surface)] transition-colors" style={{ color: "var(--color-info)" }}>
          View All Challenges
        </button>
      </div>

      {/* Your Streak */}
      <div className="neu-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} color="#F97316" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Your Streak</h3>
        </div>
        <div className="text-center mb-3">
          <span className="text-3xl font-black" style={{ color: "var(--color-amber)" }}>{STREAK_DATA.currentStreak}</span>
          <span className="text-sm font-semibold text-[var(--color-text-secondary)] ml-1">Days</span>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Keep it up! 🔥</p>
        </div>
        <div className="flex justify-between mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border"
                style={{
                  background: STREAK_DATA.weekActivity[i] ? "var(--color-success)" : "var(--color-surface)",
                  borderColor: STREAK_DATA.weekActivity[i] ? "var(--color-success)" : "var(--color-border)",
                  color: STREAK_DATA.weekActivity[i] ? "white" : "var(--color-text-muted)",
                }}
                aria-label={`${day}: ${STREAK_DATA.weekActivity[i] ? "active" : "inactive"}`}
              >
                {STREAK_DATA.weekActivity[i] ? "✓" : ""}
              </div>
              <span className="text-[9px] text-[var(--color-text-muted)]">{day}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-[var(--color-text-muted)]">
          🏆 Longest: {STREAK_DATA.longestStreak} days
        </p>
      </div>
    </div>
  );
}

// ─── Main LeaderboardPage ─────────────────────────────────────────────────────

export function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>("global");
  const [view, setView] = useState<LeaderboardView>("citizen");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AnyEntry | null>(null);
  const [highlightMe, setHighlightMe] = useState(false);
  const meRowRef = useRef<HTMLDivElement | null>(null);

  const rawData: AnyEntry[] = view === "citizen"
    ? CITIZEN_LEADERBOARD
    : view === "district-admin"
      ? ADMIN_LEADERBOARD.filter((a) => a.role === "District Admin")
      : ADMIN_LEADERBOARD.filter((a) => a.role === "Sub-District Admin");

  const totalPages = Math.ceil((rawData.length - 3) / PAGE_SIZE);
  const topThree = rawData.slice(0, 3);
  const listData = rawData.slice(3, 3 + page * PAGE_SIZE);
  const currentUserIdx = view === "citizen" ? CITIZEN_LEADERBOARD.findIndex((e) => e.isCurrentUser) : -1;
  const currentUserRank = currentUserIdx >= 0 ? CITIZEN_LEADERBOARD[currentUserIdx].rank : null;

  const handleHighlightMe = useCallback(() => {
    setHighlightMe(true);
    setTimeout(() => {
      meRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    setTimeout(() => setHighlightMe(false), 2500);
  }, []);

  // Reset page on view/scope/time change
  useEffect(() => { setPage(1); }, [view, scope, timeFilter]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
              <Trophy size={24} color="#F59E0B" aria-hidden="true" />
              Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
              Recognizing the heroes making our roads safer for everyone.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
            <span className="text-[10px] text-[var(--color-text-muted)]">Updates every 5 min</span>
          </div>
        </div>
      </motion.div>

      {/* ── Sticky control strip ───────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="sticky top-0 z-30 pt-2 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-5"
        style={{ background: "var(--color-page)", borderBottom: "1px solid var(--color-border)" }}
      >
        {/* Row 1: Scope + View */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Scope */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]" role="tablist" aria-label="Scope filter">
            {SCOPE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={scope === tab.key}
                  onClick={() => setScope(tab.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    color: scope === tab.key ? "var(--color-card)" : "var(--color-text-muted)",
                    background: scope === tab.key ? "var(--color-text-primary)" : "transparent",
                  }}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* View */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]" role="tablist" aria-label="View filter">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={view === tab.key}
                  onClick={() => setView(tab.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    color: view === tab.key ? "var(--color-card)" : "var(--color-text-muted)",
                    background: view === tab.key ? "var(--color-text-primary)" : "transparent",
                  }}
                >
                  <Icon size={12} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="ml-auto text-xs px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)] cursor-pointer"
            aria-label="Time period filter"
          >
            {TIME_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </motion.div>

      {/* ── Two-column layout on desktop ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── Podium ──────────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="neu-card p-5 sm:p-6">
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-2 pb-1">
              {/* Render order: 2nd (left), 1st (center), 3rd (right) */}
              {[1, 0, 2].map((dataIdx) => {
                const entry = topThree[dataIdx];
                const cfg = MEDAL_CONFIGS[dataIdx];
                if (!entry) return null;
                return <PodiumCard key={dataIdx} entry={entry} config={cfg} onSelect={setSelectedEntry} />;
              })}
            </div>
          </motion.div>

          {/* ── List header ─────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">
                Showing Top {Math.min(3 + listData.length, rawData.length)} of {rawData.length}
              </span>
              <div className="flex items-center gap-3">
                {/* Highlight Me toggle */}
                {view === "citizen" && currentUserRank && (
                  <button
                    onClick={handleHighlightMe}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-200"
                    style={{
                      color: "var(--color-amber)",
                      borderColor: "color-mix(in srgb, var(--color-amber) 40%, transparent)",
                      background: "color-mix(in srgb, var(--color-amber) 8%, transparent)",
                    }}
                    aria-label={`Highlight my position: Rank ${currentUserRank}`}
                  >
                    <Star size={12} />
                    Highlight Me
                  </button>
                )}
              </div>
            </div>

            {/* Column headers (desktop) */}
            <div className="hidden sm:grid grid-cols-[2.5rem_2.5rem_1fr_auto_auto_auto_1.5rem] gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold border-b border-[var(--color-border)] mb-1">
              <span>Rank</span>
              <span />
              <span>{view === "citizen" ? "Citizen" : "Admin"}</span>
              <span className="text-right">{view === "citizen" ? "Points (XP)" : "Resolved"}</span>
              <span className="text-right">{view === "citizen" ? "Reports" : "Avg Time"}</span>
              <span className="text-right">{view === "citizen" ? "Reputation" : "Accuracy"}</span>
              <span />
            </div>
          </motion.div>

          {/* ── List rows ────────────────────────────────────────────────────── */}
          <motion.div variants={stagger} className="space-y-1.5">
            <AnimatePresence mode="wait">
              {listData.map((entry, i) => {
                const isMe = entry.isCurrentUser;
                return (
                  <div key={`${entry.rank}-${view}`} ref={isMe ? meRowRef : undefined}>
                    <ListRow
                      entry={entry}
                      view={view}
                      onSelect={setSelectedEntry}
                      index={i}
                    />
                    {highlightMe && isMe && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                        className="h-0.5 rounded-full mx-2 mt-0.5"
                        style={{ background: "linear-gradient(90deg, transparent, var(--color-amber), transparent)" }}
                      />
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* ── Pagination ───────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="flex items-center justify-between pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              ‹ Prev
            </button>
            <span className="text-xs text-[var(--color-text-muted)]" aria-live="polite">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              Next ›
            </button>
          </motion.div>

          {/* ── Info footnote ────────────────────────────────────────────────── */}
          <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5 pb-4">
            <Info size={11} aria-hidden="true" />
            Rankings refresh every 5 minutes. Scores based on verified activity only.
          </p>
        </div>

        {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
          <GlobalStatsSidebar />
        </aside>
      </div>

      {/* ── Mobile sidebar (below list on small screens) ─────────────────── */}
      <div className="lg:hidden mt-6">
        <GlobalStatsSidebar />
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEntry && (
          <DetailModal
            entry={selectedEntry}
            view={view}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
