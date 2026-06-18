"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, RefreshCw, ChevronDown,
  Globe2, Map, MapPin, Users, Shield, Building,
  X, BadgeCheck, Star, Zap, Clock,
  ClipboardList, CheckCircle, Wrench, Landmark,
  ArrowUpRight, Activity,
} from "lucide-react";
import {
  CITIZEN_LEADERBOARD,
  ADMIN_LEADERBOARD,
  GLOBAL_STATS,
  LEADERBOARD_CHALLENGES,
  STREAK_DATA,
  RANK_PROGRESS,
} from "./mockData";
import { PodiumSection } from "./PodiumSection";
import { RankedList } from "./RankedList";
import { GlobalImpactCard } from "./GlobalImpactCard";
import { ChallengesCard } from "./ChallengesCard";
import { StreakCard } from "./StreakCard";
import { YourRankCard } from "./YourRankCard";
import type { AnyEntry, LeaderboardView, LeaderboardScope, TimeFilter } from "@/types/leaderboard";
import { isCitizenEntry } from "@/types/leaderboard";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

interface ScopeTab {
  key: LeaderboardScope | LeaderboardView;
  label: string;
  Icon: React.ElementType;
  group: "scope" | "view";
}

// Combined flat tab bar: scope tabs + view tabs
const ALL_TABS: ScopeTab[] = [
  { key: "global",              label: "Global",            Icon: Globe2,    group: "scope" },
  { key: "district",            label: "District",          Icon: Map,       group: "scope" },
  { key: "sub-district",        label: "Sub-District",      Icon: MapPin,    group: "scope" },
  { key: "citizen",             label: "Citizen",           Icon: Users,     group: "view"  },
  { key: "sub-district-admin",  label: "Sub-District Admin",Icon: Shield,    group: "view"  },
  { key: "district-admin",      label: "District Admin",    Icon: Building,  group: "view"  },
];

const TIME_OPTIONS: { key: TimeFilter; label: string }[] = [
  { key: "all-time",   label: "All Time"   },
  { key: "this-month", label: "This Month" },
  { key: "this-week",  label: "This Week"  },
];

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
};
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ entry, onClose }: { entry: AnyEntry; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
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
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between p-4 sm:p-5 border-b"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white"
              style={{
                background: entry.avatarColor,
                boxShadow: entry.isCurrentUser
                  ? "0 0 0 2px var(--color-amber), 0 0 10px rgba(245,158,11,0.25)"
                  : undefined,
              }}
            >
              {entry.initial}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {entry.name}
                </h2>
                {isCitizenEntry(entry) && entry.isVerifiedUser && (
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
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            aria-label="Close modal"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {isCitizenEntry(entry) ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total Points",  value: entry.points.toLocaleString(),    color: "var(--color-amber)"   },
                  { label: "Reputation",    value: `${entry.reputation}/100`,        color: "var(--color-success)" },
                  { label: "Impact Score",  value: `${entry.impactScore}/100`,       color: "var(--color-info)"    },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="p-2.5 rounded-xl border flex flex-col gap-1"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                  >
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{chip.label}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: chip.color }}>{chip.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Performance
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: <ClipboardList size={12} style={{ color: "var(--color-info)" }} />,    label: "Reports Submitted",    value: entry.totalReports            },
                    { icon: <CheckCircle   size={12} style={{ color: "var(--color-success)" }} />, label: "Verified Reports",     value: entry.validationCount         },
                    { icon: <Wrench        size={12} style={{ color: "var(--color-amber)" }} />,   label: "Hazards Resolved",     value: entry.resolvedCount           },
                    { icon: <Landmark      size={12} style={{ color: "#8B5CF6" }} />,              label: "Authority Actions",    value: entry.authorityActionsTriggered },
                    { icon: <Activity      size={12} style={{ color: "var(--color-danger)" }} />,  label: "High-Risk Reports",    value: entry.highRiskReports         },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-1.5 border-b last:border-0"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {row.icon}{row.label}
                      </div>
                      <span className="text-xs font-semibold tabular-nums font-mono" style={{ color: "var(--color-text-primary)" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--color-text-muted)" }}>
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
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Issues Resolved",  value: entry.issuesResolved,              color: "var(--color-success)" },
                  { label: "Avg Resolution",   value: entry.avgResolutionTime,           color: "var(--color-info)"    },
                  { label: "Validation Acc.",  value: `${entry.validationAccuracy}%`,    color: "var(--color-amber)"   },
                  { label: "Citizen Rating",   value: `${entry.citizenRating.toFixed(1)}/5`, color: "#8B5CF6"          },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="p-2.5 rounded-xl border flex flex-col gap-1"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                  >
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{chip.label}</span>
                    <span className="text-sm font-bold font-mono" style={{ color: chip.color }}>{chip.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Activity
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: <ClipboardList size={12} style={{ color: "var(--color-info)" }} />,    label: "Total Tickets",    value: entry.totalTickets   },
                    { icon: <ArrowUpRight  size={12} style={{ color: "var(--color-amber)" }} />,   label: "Escalations",      value: entry.escalations    },
                    { icon: <Star          size={12} style={{ color: "#8B5CF6" }} />,              label: "Response Rate",    value: `${entry.responseRate}%` },
                    { icon: <Clock         size={12} style={{ color: "var(--color-text-muted)" }} />, label: "Avg Resolution",value: entry.avgResolutionTime },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-1.5 border-b last:border-0"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {row.icon}{row.label}
                      </div>
                      <span className="text-xs font-semibold tabular-nums font-mono" style={{ color: "var(--color-text-primary)" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Spinning refresh icon ────────────────────────────────────────────────────

function RefreshIndicator() {
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpinning(true);
      setTimeout(() => setSpinning(false), 700);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5" aria-label="Updates every 5 minutes">
      <motion.span
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <RefreshCw size={12} style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
      </motion.span>
      <span
        className="text-[11px] font-mono"
        style={{ color: "var(--color-text-muted)" }}
      >
        ↻ Updates every 5 min
      </span>
    </div>
  );
}

// ─── Reusable pill group ──────────────────────────────────────────────────────

const SCOPE_TABS = ALL_TABS.filter((t) => t.group === "scope");
const VIEW_TABS  = ALL_TABS.filter((t) => t.group === "view");

function PillGroup({
  tabs,
  activeKey,
  onSelect,
  ariaLabel,
}: {
  tabs: ScopeTab[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 p-1 rounded-full"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-amber)]"
            style={{
              background: isActive ? "var(--color-amber)" : "transparent",
              color: isActive ? "#1C2B3A" : "var(--color-text-muted)",
              boxShadow: isActive ? "0 0 10px rgba(245,158,11,0.35)" : "none",
            }}
          >
            <tab.Icon size={11} aria-hidden="true" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Period dropdown ──────────────────────────────────────────────────────────

function PeriodDropdown({
  timeFilter,
  onTimeChange,
}: {
  timeFilter: TimeFilter;
  onTimeChange: (t: TimeFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = TIME_OPTIONS.find((o) => o.key === timeFilter)?.label ?? "All Time";

  return (
    <div ref={dropRef} className="relative">
      <button
        className="btn-outline flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select time period"
      >
        {currentLabel}
        <ChevronDown
          size={13}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-36 rounded-xl border overflow-hidden z-40"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            role="listbox"
            aria-label="Time period options"
          >
            {TIME_OPTIONS.map((o) => (
              <button
                key={o.key}
                role="option"
                aria-selected={o.key === timeFilter}
                onClick={() => { onTimeChange(o.key); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs transition-colors"
                style={{
                  background: o.key === timeFilter
                    ? "color-mix(in srgb, var(--color-amber) 10%, transparent)"
                    : "transparent",
                  color: o.key === timeFilter ? "var(--color-amber)" : "var(--color-text-secondary)",
                }}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Single-row filter bar ────────────────────────────────────────────────────

function FilterBar({
  activeScope,
  activeView,
  onScopeChange,
  onViewChange,
  timeFilter,
  onTimeChange,
}: {
  activeScope: LeaderboardScope;
  activeView: LeaderboardView;
  onScopeChange: (s: LeaderboardScope) => void;
  onViewChange: (v: LeaderboardView) => void;
  timeFilter: TimeFilter;
  onTimeChange: (t: TimeFilter) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Scope pill group */}
      <PillGroup
        tabs={SCOPE_TABS}
        activeKey={activeScope}
        onSelect={(k) => onScopeChange(k as LeaderboardScope)}
        ariaLabel="Geographic scope"
      />

      {/* Vertical divider */}
      <div
        className="w-px self-stretch"
        style={{ background: "var(--color-border)" }}
        aria-hidden="true"
      />

      {/* View pill group */}
      <PillGroup
        tabs={VIEW_TABS}
        activeKey={activeView}
        onSelect={(k) => onViewChange(k as LeaderboardView)}
        ariaLabel="Leaderboard view"
      />

      {/* Period dropdown — pushed to the right */}
      <div className="ml-auto">
        <PeriodDropdown timeFilter={timeFilter} onTimeChange={onTimeChange} />
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <div className="space-y-4">
      <GlobalImpactCard stats={GLOBAL_STATS} />
      <ChallengesCard challenges={LEADERBOARD_CHALLENGES} />
      <StreakCard data={STREAK_DATA} />
      <YourRankCard progress={RANK_PROGRESS} />
    </div>
  );
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-1.5" aria-busy="true" aria-label="Loading leaderboard…">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl h-16 animate-pulse"
          style={{ background: "var(--color-surface)" }}
        />
      ))}
    </div>
  );
}

// ─── LeaderboardPage ──────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const [scope, setScope]           = useState<LeaderboardScope>("global");
  const [view, setView]             = useState<LeaderboardView>("citizen");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [page, setPage]             = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AnyEntry | null>(null);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [highlightUserId, setHighlightUserId] = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);

  // Simulate loading on filter change
  useEffect(() => {
    setPage(1);
    setExpandedId(null);
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [view, scope, timeFilter]);

  const rawData: AnyEntry[] = view === "citizen"
    ? CITIZEN_LEADERBOARD
    : view === "district-admin"
      ? ADMIN_LEADERBOARD.filter((a) => a.role === "District Admin")
      : ADMIN_LEADERBOARD.filter((a) => a.role === "Sub-District Admin");

  const topThree  = rawData.slice(0, 3);
  const listData  = rawData.slice(3, 3 + page * PAGE_SIZE);
  const hasMore   = 3 + listData.length < rawData.length;

  const meEntry   = view === "citizen"
    ? CITIZEN_LEADERBOARD.find((e) => e.isCurrentUser) ?? null
    : null;

  const handleHighlightMe = useCallback(() => {
    if (!meEntry) return;
    setHighlightUserId(meEntry.name);
    window.dispatchEvent(new Event("leaderboard:highlightMe"));
    setTimeout(() => setHighlightUserId(null), 2500);
  }, [meEntry]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* ── Page Header ── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-black flex items-center gap-2.5"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Trophy size={26} style={{ color: "var(--color-amber)" }} aria-hidden="true" />
            Leaderboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Recognising the heroes making our roads safer.
          </p>
        </div>
        <RefreshIndicator />
      </motion.div>

      {/* ── Scope tabs + Period ── */}
      <motion.div variants={fadeUp} className="mb-5">
        <FilterBar
          activeScope={scope}
          activeView={view}
          onScopeChange={setScope}
          onViewChange={setView}
          timeFilter={timeFilter}
          onTimeChange={setTimeFilter}
        />
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Podium */}
          <motion.div variants={fadeUp}>
            <PodiumSection
              topThree={topThree}
              totalCount={rawData.length}
              visibleCount={3 + listData.length}
              onSelect={setSelectedEntry}
              onHighlightMe={handleHighlightMe}
              showHighlightMe={!!meEntry}
            />
          </motion.div>

          {/* Ranked list — scrolls within fixed-height container */}
          <motion.div variants={fadeUp}>
            {/* Column headers — sticky above the scroll area */}
            <div
              className="hidden sm:flex items-center gap-3 sm:gap-4 px-4 py-2 mb-1 text-[10px] uppercase tracking-widest font-semibold border-b"
              style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
              aria-hidden="true"
            >
              <span className="w-10 text-center">Rank</span>
              <span className="w-10" />
              <span className="flex-1">{view === "citizen" ? "Citizen" : "Admin"}</span>
              <span className="w-20 text-right">Points</span>
              <span className="w-16 text-right hidden sm:block">Rep</span>
              <span className="w-7" />
            </div>

            {/* Scrollable list container */}
            <div
              className="overflow-y-auto rounded-xl"
              style={{ maxHeight: "520px" }}
              role="region"
              aria-label="Ranked list"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <SkeletonRows key="skeleton" />
                ) : (
                  <motion.div
                    key={`${view}-${scope}-${timeFilter}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RankedList
                      entries={listData}
                      view={view}
                      totalCount={rawData.length}
                      hasMore={hasMore}
                      onLoadMore={() => setPage((p) => p + 1)}
                      onSelect={setSelectedEntry}
                      expandedId={expandedId}
                      onToggleExpand={handleToggleExpand}
                      highlightUserId={highlightUserId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden lg:block w-80 flex-shrink-0"
          aria-label="Leaderboard sidebar"
        >
          <Sidebar />
        </aside>
      </div>

      {/* ── Mobile sidebar ── */}
      <div className="lg:hidden mt-6">
        <Sidebar />
      </div>

      {/* ── Detail modal ── */}
      <AnimatePresence>
        {selectedEntry && (
          <DetailModal
            key="detail-modal"
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
