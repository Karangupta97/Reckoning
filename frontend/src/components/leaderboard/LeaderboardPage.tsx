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

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyEntry = CitizenEntry | AdminEntry;

function isCitizen(e: AnyEntry): e is CitizenEntry {
  return "points" in e;
}

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.035 } },
};
const listItem = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPE_TABS: { key: LeaderboardScope; label: string; icon: React.ElementType }[] = [
  { key: "global",       label: "Global",       icon: Globe2  },
  { key: "district",     label: "District",     icon: Map     },
  { key: "sub-district", label: "Sub-District", icon: MapPin  },
];

const VIEW_TABS: { key: LeaderboardView; label: string; icon: React.ElementType }[] = [
  { key: "citizen",           label: "Citizen",            icon: Users    },
  { key: "sub-district-admin",label: "Sub-District Admin", icon: Shield   },
  { key: "district-admin",    label: "District Admin",     icon: Building },
];

const TIME_OPTIONS: { key: TimeFilter; label: string }[] = [
  { key: "all-time",    label: "All Time"   },
  { key: "this-month",  label: "This Month" },
  { key: "this-week",   label: "This Week"  },
];

// All podium colors use CSS var tokens or well-defined medal tones
// (no hardcoded hex for brand colors; medal tones are internationally universal)
const MEDAL_CONFIGS = [
  {
    medal:       "🥇",
    barColor:    "rgba(245,158,11,0.18)",
    barBorder:   "rgba(245,158,11,0.5)",
    ringColor:   "#F59E0B",
    glow:        "rgba(245,158,11,0.28)",
    reward:      "1,000",
    barHeight:   "h-20 sm:h-24",
    avatarSize:  "w-14 h-14 sm:w-[52px] sm:h-[52px] text-lg",
    order:       1,
    isFirst:     true,
  },
  {
    medal:       "🥈",
    barColor:    "rgba(148,163,184,0.13)",
    barBorder:   "rgba(148,163,184,0.45)",
    ringColor:   "#94A3B8",
    glow:        "rgba(148,163,184,0.2)",
    reward:      "500",
    barHeight:   "h-14 sm:h-20",
    avatarSize:  "w-11 h-11 sm:w-[44px] sm:h-[44px] text-sm",
    order:       0,
    isFirst:     false,
  },
  {
    medal:       "🥉",
    barColor:    "rgba(205,127,50,0.13)",
    barBorder:   "rgba(205,127,50,0.45)",
    ringColor:   "#CD7F32",
    glow:        "rgba(205,127,50,0.2)",
    reward:      "250",
    barHeight:   "h-10 sm:h-14",
    avatarSize:  "w-11 h-11 sm:w-[44px] sm:h-[44px] text-sm",
    order:       2,
    isFirst:     false,
  },
];

const PAGE_SIZE = 20;

// ─── Rank Trend Icon ──────────────────────────────────────────────────────────

function RankTrend({ current, prev }: { current: number; prev: number }) {
  const diff = prev - current;
  if (diff > 0)
    return (
      <span
        className="flex items-center gap-0.5 text-[10px] font-bold"
        style={{ color: "var(--color-success)" }}
        aria-label={`Up ${diff} positions`}
      >
        <TrendingUp size={10} strokeWidth={2.5} />{diff}
      </span>
    );
  if (diff < 0)
    return (
      <span
        className="flex items-center gap-0.5 text-[10px] font-bold"
        style={{ color: "var(--color-danger)" }}
        aria-label={`Down ${Math.abs(diff)} positions`}
      >
        <TrendingDown size={10} strokeWidth={2.5} />{Math.abs(diff)}
      </span>
    );
  return <Minus size={10} strokeWidth={2} className="opacity-30" aria-label="No change" />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  initial, color, size = "md", isCurrentUser = false,
}: {
  initial: string; color: string;
  size?: "sm" | "md" | "lg" | "xl";
  isCurrentUser?: boolean;
}) {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-11 h-11 text-sm",
    xl: "w-14 h-14 text-base",
  };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 relative`}
      style={{
        background: color,
        boxShadow: isCurrentUser
          ? "0 0 0 2px var(--color-amber), 0 0 10px rgba(245,158,11,0.25)"
          : undefined,
      }}
      aria-hidden="true"
    >
      {initial}
      {isCurrentUser && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{
            background: "var(--color-amber)",
            borderColor: "var(--color-card)",
          }}
        />
      )}
    </div>
  );
}

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({
  entry, config, onSelect,
}: {
  entry: AnyEntry;
  config: (typeof MEDAL_CONFIGS)[number];
  onSelect: (e: AnyEntry) => void;
}) {
  const name = entry.name;
  const xpLabel = isCitizen(entry)
    ? `${entry.points.toLocaleString()} XP`
    : `${entry.issuesResolved} solved`;

  return (
    <motion.button
      initial={{ opacity: 0, y: config.isFirst ? -16 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: config.order * 0.1 }}
      onClick={() => onSelect(entry)}
      className="flex flex-col items-center flex-1 max-w-[130px] focus:outline-none group"
      aria-label={`${config.order + 1}st: ${name} – ${xpLabel}. Tap for details.`}
    >
      {/* Medal emoji */}
      <span className={`mb-1 leading-none select-none ${config.isFirst ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
        {config.medal}
      </span>

      {/* Avatar with glow */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-80 transition-opacity"
          style={{ background: config.glow }}
        />
        <div
          className={`relative ${config.avatarSize} rounded-full flex items-center justify-center font-bold text-white border-[2.5px] group-hover:scale-105 transition-transform duration-200`}
          style={{
            background: entry.avatarColor,
            borderColor: config.ringColor,
            boxShadow: config.isFirst
              ? `0 6px 24px ${config.glow}`
              : `0 4px 12px ${config.glow}`,
          }}
        >
          {entry.initial}
        </div>
      </div>

      {/* Name */}
      <div className="mt-2 text-center w-full px-1">
        <div className="flex items-center justify-center gap-1">
          <span
            className={`font-semibold truncate max-w-[100px] text-[var(--color-text-primary)] ${config.isFirst ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}
          >
            {name.split(" ")[0]}
          </span>
          {isCitizen(entry) && entry.isVerifiedUser && (
            <BadgeCheck size={11} style={{ color: "var(--color-info)" }} aria-label="Verified" />
          )}
        </div>
        {/* XP in amber */}
        <span
          className={`font-bold tabular-nums ${config.isFirst ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}
          style={{ color: "var(--color-amber)" }}
        >
          {xpLabel}
        </span>
      </div>

      {/* "+XP reward" badge */}
      <div
        className="mt-1.5 px-2 py-0.5 rounded-full flex items-center gap-1 text-[9px] font-semibold border"
        style={{
          background: `color-mix(in srgb, ${config.ringColor} 10%, transparent)`,
          borderColor: `color-mix(in srgb, ${config.ringColor} 30%, transparent)`,
          color: config.ringColor,
        }}
      >
        <Gift size={8} />+{config.reward} XP
      </div>

      {/* Podium step bar */}
      <div
        className={`w-full ${config.barHeight} rounded-t-xl mt-2 border border-b-0`}
        style={{
          background: `linear-gradient(180deg, ${config.barColor}, transparent)`,
          borderColor: config.barBorder,
          borderTopWidth: "2px",
        }}
      />
    </motion.button>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function ListRow({
  entry, view, onSelect,
}: {
  entry: AnyEntry;
  view: LeaderboardView;
  onSelect: (e: AnyEntry) => void;
}) {
  const isMe = entry.isCurrentUser;

  return (
    <motion.button
      variants={listItem}
      onClick={() => onSelect(entry)}
      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-left group relative overflow-hidden"
      style={{
        background: isMe
          ? "color-mix(in srgb, var(--color-amber) 6%, var(--color-card))"
          : "var(--color-card)",
        borderColor: isMe
          ? "color-mix(in srgb, var(--color-amber) 35%, transparent)"
          : "var(--color-border)",
      }}
      aria-label={`${entry.name}, Rank ${entry.rank}`}
    >
      {/* Teal left border for current user */}
      {isMe && (
        <span
          className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
          style={{ background: "var(--color-teal, #14b8a6)" }}
        />
      )}

      {/* Rank + trend */}
      <div className="w-8 flex flex-col items-center flex-shrink-0 ml-1">
        <span
          className="text-xs font-bold tabular-nums leading-none"
          style={{
            color: isMe ? "var(--color-amber)" : "var(--color-text-muted)",
          }}
        >
          {entry.rank}
        </span>
        <RankTrend current={entry.rank} prev={entry.prevRank} />
      </div>

      {/* Avatar */}
      <Avatar
        initial={entry.initial}
        color={entry.avatarColor}
        size="md"
        isCurrentUser={isMe}
      />

      {/* Name + sub-meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-xs sm:text-sm font-semibold truncate"
            style={{
              color: isMe ? "var(--color-amber)" : "var(--color-text-primary)",
            }}
          >
            {entry.name}
            {isMe && (
              <span
                className="text-[10px] ml-1 font-normal"
                style={{ color: "var(--color-text-muted)" }}
              >
                (You)
              </span>
            )}
          </span>
          {isCitizen(entry) && entry.isVerifiedUser && (
            <BadgeCheck size={12} style={{ color: "var(--color-info)" }} aria-label="Verified" />
          )}
        </div>
        {view === "citizen" && isCitizen(entry) && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {entry.district}
            </span>
            <span
              className="text-[10px] hidden sm:inline"
              style={{ color: "var(--color-text-muted)" }}
            >
              · {entry.reports} reports
            </span>
          </div>
        )}
        {view !== "citizen" && !isCitizen(entry) && (
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {entry.district} · {entry.role}
          </span>
        )}
      </div>

      {/* Core metric */}
      <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
        {view === "citizen" && isCitizen(entry) ? (
          <>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: "var(--color-amber)" }}
            >
              {entry.points.toLocaleString()} XP
            </span>
            <span
              className="text-[10px] tabular-nums hidden sm:block"
              style={{ color: "var(--color-text-muted)" }}
            >
              Rep {entry.reputation}
            </span>
          </>
        ) : !isCitizen(entry) ? (
          <>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: "var(--color-success)" }}
            >
              {entry.issuesResolved} solved
            </span>
            <span
              className="text-[10px] tabular-nums hidden sm:block"
              style={{ color: "var(--color-text-muted)" }}
            >
              {entry.validationAccuracy}% acc
            </span>
          </>
        ) : null}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={14}
        className="flex-shrink-0 transition-colors duration-150"
        style={{
          color: "var(--color-text-muted)",
        }}
        aria-hidden="true"
      />
    </motion.button>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  entry, view, onClose,
}: {
  entry: AnyEntry;
  view: LeaderboardView;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
          className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-start justify-between p-4 sm:p-5 border-b"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <Avatar
                initial={entry.initial}
                color={entry.avatarColor}
                size="lg"
                isCurrentUser={entry.isCurrentUser}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {entry.name}
                  </h2>
                  {isCitizen(entry) && entry.isVerifiedUser && (
                    <BadgeCheck size={14} style={{ color: "var(--color-info)" }} />
                  )}
                </div>
                <span
                  className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
                  style={{
                    background: "color-mix(in srgb, var(--color-amber) 15%, transparent)",
                    color: "var(--color-amber)",
                  }}
                >
                  Rank #{entry.rank}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            {isCitizen(entry) ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <MetricChip label="Total Points" value={entry.points.toLocaleString()} icon={<Trophy size={13} color="#F59E0B" />} />
                  <MetricChip label="Reputation" value={`${entry.reputation}/100`} icon={<Star size={13} color="#22C55E" />} />
                  <MetricChip label="Impact Score" value={`${entry.impactScore}/100`} icon={<Zap size={13} color="#3B82F6" />} />
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--color-text-muted)" }}>
                    Performance
                  </h3>
                  <div className="space-y-1.5">
                    <PerfRow icon={<ClipboardList size={12} color="var(--color-info)" />} label="Reports Submitted" value={entry.totalReports} />
                    <PerfRow icon={<CheckCircle size={12} color="var(--color-success)" />} label="Verified Reports" value={entry.validationCount} />
                    <PerfRow icon={<Wrench size={12} color="var(--color-amber)" />} label="Hazards Resolved" value={Math.floor(entry.reports * 0.35)} />
                    <PerfRow icon={<AlertTriangle size={12} color="var(--color-danger)" />} label="Rejections" value={entry.rejections} negative />
                    <PerfRow icon={<Landmark size={12} color="#8B5CF6" />} label="Authority Actions" value={entry.authorityActionsTriggered} />
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--color-text-muted)" }}>
                    Impact
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <ImpactChip icon={<Users size={12} color="var(--color-success)" />} label="Lives Impacted" value={entry.livesImpacted.toLocaleString()} />
                    <ImpactChip icon={<Map size={12} color="var(--color-info)" />} label="Roads Improved" value={`${entry.roadsImproved} km`} />
                    <ImpactChip icon={<Landmark size={12} color="#8B5CF6" />} label="Authorities Notified" value={entry.authoritiesNotified} />
                    <ImpactChip icon={<Users size={12} color="var(--color-amber)" />} label="Communities Helped" value={Math.floor(entry.authoritiesNotified * 0.09)} />
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
                    Badges
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.badges.map((b, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                        style={{
                          background: "color-mix(in srgb, var(--color-info) 10%, transparent)",
                          borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)",
                          color: "var(--color-info)",
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <MetricChip label="Issues Resolved" value={entry.issuesResolved} icon={<CheckCircle size={13} color="var(--color-success)" />} />
                  <MetricChip label="Avg Resolution" value={entry.avgResolutionTime} icon={<Clock size={13} color="var(--color-info)" />} />
                  <MetricChip label="Validation Acc." value={`${entry.validationAccuracy}%`} icon={<Activity size={13} color="var(--color-amber)" />} />
                  <MetricChip label="Citizen Rating" value={`${entry.citizenRating.toFixed(1)}/5`} icon={<Star size={13} color="#8B5CF6" />} />
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--color-text-muted)" }}>
                    Activity
                  </h3>
                  <div className="space-y-1.5">
                    <PerfRow icon={<ClipboardList size={12} color="var(--color-info)" />} label="Total Tickets" value={entry.totalTickets} />
                    <PerfRow icon={<ArrowUpRight size={12} color="var(--color-amber)" />} label="Escalations" value={entry.escalations} />
                    <PerfRow icon={<CheckCircle size={12} color="var(--color-success)" />} label="Response Rate" value={`${entry.responseRate}%`} />
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

// ─── Small helpers ────────────────────────────────────────────────────────────

function MetricChip({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div
      className="p-2.5 rounded-xl border flex flex-col gap-1"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

function PerfRow({
  icon, label, value, negative = false,
}: {
  icon: React.ReactNode; label: string; value: string | number; negative?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-1.5 border-b last:border-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {icon}{label}
      </div>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: negative ? "var(--color-danger)" : "var(--color-text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function ImpactChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div
      className="flex items-center gap-2 p-2.5 rounded-xl border"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {icon}
      <div className="min-w-0">
        <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function GlobalStatsSidebar() {
  const TEAL = "var(--color-teal, #14b8a6)";

  return (
    <div className="space-y-4">
      {/* Global Impact */}
      <div className="neu-card p-4">
        <div className="flex items-center gap-2 mb-3.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--color-info) 15%, transparent)" }}
          >
            <Globe2 size={14} style={{ color: "var(--color-info)" }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Global Impact
          </h3>
        </div>

        <div className="space-y-2.5">
          {[
            { label: "Citizens Active",    value: GLOBAL_STATS.citizensActive,    colorVar: "var(--color-info)"    },
            { label: "Reports Submitted",  value: GLOBAL_STATS.reportsSubmitted,  colorVar: "var(--color-success)" },
            { label: "Hazards Resolved",   value: GLOBAL_STATS.hazardsResolved,   colorVar: "var(--color-amber)"   },
            { label: "Lives Impacted",     value: GLOBAL_STATS.livesImpacted,     colorVar: "var(--color-danger)"  },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.colorVar }} />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{s.label}</span>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        <button
          className="w-full mt-4 py-2 rounded-xl border text-xs font-medium transition-colors"
          style={{
            borderColor: `color-mix(in srgb, ${TEAL} 30%, transparent)`,
            color: TEAL,
            background: `color-mix(in srgb, ${TEAL} 5%, transparent)`,
          }}
        >
          View Full Impact
        </button>
      </div>

      {/* Current Challenges */}
      <div className="neu-card p-4">
        <div className="flex items-center gap-2 mb-3.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--color-danger) 15%, transparent)" }}
          >
            <Zap size={14} style={{ color: "var(--color-danger)" }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Current Challenges
          </h3>
        </div>

        <div className="space-y-3">
          {LEADERBOARD_CHALLENGES.map((ch) => {
            const pct = Math.min(100, Math.round((ch.progress / ch.total) * 100));
            return (
              <div key={ch.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    {ch.title}
                  </span>
                  <Gift size={11} style={{ color: "var(--color-amber)" }} />
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden mb-1"
                  style={{ background: "var(--color-border)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${TEAL}, var(--color-success))` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {ch.progress}/{ch.total}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--color-amber)" }}>
                    +{ch.reward} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="w-full mt-4 py-2 rounded-xl border text-xs font-medium transition-colors"
          style={{
            borderColor: `color-mix(in srgb, ${TEAL} 30%, transparent)`,
            color: TEAL,
            background: `color-mix(in srgb, ${TEAL} 5%, transparent)`,
          }}
        >
          View All Challenges
        </button>
      </div>

      {/* Your Streak */}
      <div className="neu-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={15} style={{ color: "var(--color-danger)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Your Streak
          </h3>
        </div>

        <div className="text-center mb-3">
          <span className="text-3xl font-black" style={{ color: "var(--color-amber)" }}>
            {STREAK_DATA.currentStreak}
          </span>
          <span className="text-sm font-semibold ml-1" style={{ color: "var(--color-text-secondary)" }}>
            Days
          </span>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Keep it up! 🔥
          </p>
        </div>

        <div className="flex justify-between mb-2">
          {["M","T","W","T","F","S","S"].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border"
                style={{
                  background: STREAK_DATA.weekActivity[i]
                    ? "var(--color-success)"
                    : "var(--color-surface)",
                  borderColor: STREAK_DATA.weekActivity[i]
                    ? "var(--color-success)"
                    : "var(--color-border)",
                  color: STREAK_DATA.weekActivity[i] ? "#fff" : "var(--color-text-muted)",
                }}
                aria-label={`${day}: ${STREAK_DATA.weekActivity[i] ? "active" : "inactive"}`}
              >
                {STREAK_DATA.weekActivity[i] ? "✓" : ""}
              </div>
              <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{day}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          🏆 Longest: {STREAK_DATA.longestStreak} days
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const [scope, setScope]           = useState<LeaderboardScope>("global");
  const [view, setView]             = useState<LeaderboardView>("citizen");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [page, setPage]             = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AnyEntry | null>(null);
  const [highlightMe, setHighlightMe]     = useState(false);
  const meRowRef = useRef<HTMLDivElement | null>(null);

  const TEAL = "var(--color-teal, #14b8a6)";

  const rawData: AnyEntry[] = view === "citizen"
    ? CITIZEN_LEADERBOARD
    : view === "district-admin"
      ? ADMIN_LEADERBOARD.filter((a) => a.role === "District Admin")
      : ADMIN_LEADERBOARD.filter((a) => a.role === "Sub-District Admin");

  const totalPages = Math.ceil((rawData.length - 3) / PAGE_SIZE);
  const topThree   = rawData.slice(0, 3);
  const listData   = rawData.slice(3, 3 + page * PAGE_SIZE);
  const meIdx      = view === "citizen" ? CITIZEN_LEADERBOARD.findIndex((e) => e.isCurrentUser) : -1;
  const meRank     = meIdx >= 0 ? CITIZEN_LEADERBOARD[meIdx].rank : null;

  const handleHighlightMe = useCallback(() => {
    setHighlightMe(true);
    setTimeout(() => meRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    setTimeout(() => setHighlightMe(false), 2500);
  }, []);

  useEffect(() => { setPage(1); }, [view, scope, timeFilter]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* ── Page Header ── */}
      <motion.div variants={fadeUp} className="mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-xl sm:text-2xl font-black flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Trophy size={22} style={{ color: "var(--color-amber)" }} aria-hidden="true" />
              Leaderboard
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Recognising the heroes making our roads safer.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw size={12} style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              Updates every 5 min
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Sticky filter strip ── */}
      <motion.div
        variants={fadeUp}
        className="sticky top-0 z-30 pt-2 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-5"
        style={{
          background: "var(--color-page)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {/* Scope pills */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-full"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
            role="tablist"
            aria-label="Scope"
          >
            {SCOPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = scope === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(tab.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                  style={{
                    color: active ? "#fff" : "var(--color-text-muted)",
                    background: active ? TEAL : "transparent",
                    boxShadow: active
                      ? `0 0 8px color-mix(in srgb, ${TEAL} 40%, transparent)`
                      : "none",
                  }}
                >
                  <Icon size={11} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* View pills */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-full"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
            role="tablist"
            aria-label="View"
          >
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = view === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(tab.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                  style={{
                    color: active ? "#fff" : "var(--color-text-muted)",
                    background: active ? TEAL : "transparent",
                    boxShadow: active
                      ? `0 0 8px color-mix(in srgb, ${TEAL} 40%, transparent)`
                      : "none",
                  }}
                >
                  <Icon size={11} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="ml-auto text-xs px-2.5 py-1.5 rounded-full border transition-colors focus:outline-none cursor-pointer"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Time period"
          >
            {TIME_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Podium */}
          <motion.div variants={fadeUp}>
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-end justify-center gap-3 sm:gap-6 pb-0">
                {/* Order: 2nd (left) · 1st (center) · 3rd (right) */}
                {[1, 0, 2].map((dataIdx) => {
                  const entry = topThree[dataIdx];
                  const cfg   = MEDAL_CONFIGS[dataIdx];
                  if (!entry) return null;
                  return (
                    <PodiumCard
                      key={dataIdx}
                      entry={entry}
                      config={cfg}
                      onSelect={setSelectedEntry}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* List header */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Showing Top {Math.min(3 + listData.length, rawData.length)} of {rawData.length}
              </span>
              {view === "citizen" && meRank && (
                <button
                  onClick={handleHighlightMe}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200"
                  style={{
                    color: TEAL,
                    borderColor: `color-mix(in srgb, ${TEAL} 35%, transparent)`,
                    background: `color-mix(in srgb, ${TEAL} 8%, transparent)`,
                  }}
                  aria-label={`Highlight my position: Rank ${meRank}`}
                >
                  <Star size={11} />
                  Highlight Me
                </button>
              )}
            </div>

            {/* Column headers */}
            <div
              className="hidden sm:grid px-3 py-2 text-[10px] uppercase tracking-wide font-semibold border-b mb-1"
              style={{
                color: "var(--color-text-muted)",
                borderColor: "var(--color-border)",
                gridTemplateColumns: "2.5rem 2rem 1fr auto auto 1.5rem",
                gap: "0.5rem",
              }}
            >
              <span>Rank</span>
              <span />
              <span>{view === "citizen" ? "Citizen" : "Admin"}</span>
              <span className="text-right">{view === "citizen" ? "Points" : "Resolved"}</span>
              <span className="text-right">{view === "citizen" ? "Rep" : "Accuracy"}</span>
              <span />
            </div>
          </motion.div>

          {/* Rows */}
          <motion.div variants={stagger} className="space-y-1.5">
            <AnimatePresence mode="wait">
              {listData.map((entry) => (
                <div
                  key={`${entry.rank}-${view}`}
                  ref={entry.isCurrentUser ? meRowRef : undefined}
                >
                  <ListRow
                    entry={entry}
                    view={view}
                    onSelect={setSelectedEntry}
                  />
                  {highlightMe && entry.isCurrentUser && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ scaleX: 0 }}
                      className="h-0.5 rounded-full mx-2 mt-0.5"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)`,
                      }}
                    />
                  )}
                </div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          <motion.div variants={fadeUp} className="flex items-center justify-between pt-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs px-3 py-2 rounded-xl border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                background: "var(--color-card)",
              }}
              aria-label="Previous page"
            >
              ‹ Prev
            </button>

            <span className="text-xs" style={{ color: "var(--color-text-muted)" }} aria-live="polite">
              {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs px-3 py-2 rounded-xl border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                background: "var(--color-card)",
              }}
              aria-label="Next page"
            >
              Next ›
            </button>
          </motion.div>

          {/* Footer note */}
          <p
            className="flex items-center gap-1.5 text-[10px] pb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Info size={10} aria-hidden="true" />
            Rankings refresh every 5 minutes. Scores based on verified activity only.
          </p>
        </div>

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
          <GlobalStatsSidebar />
        </aside>
      </div>

      {/* ── Mobile sidebar ── */}
      <div className="lg:hidden mt-6">
        <GlobalStatsSidebar />
      </div>

      {/* ── Detail Modal ── */}
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
