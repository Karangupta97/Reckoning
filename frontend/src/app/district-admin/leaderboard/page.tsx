"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, TrendingUp, TrendingDown, Minus,
  Crown, RefreshCw, Clock, ShieldCheck,
  ArrowUpRight, ChevronDown, X,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import {
  useLeaderboardStore,
  type DistrictOfficerEntry,
} from "@/store/leaderboardStore";

// ─── Types & helpers ──────────────────────────────────────────────────────────

type TimeFilter = "all-time" | "this-month" | "this-week";

const MEDAL = ["🥇", "🥈", "🥉"] as const;
const RING  = ["#FFD700", "#94A3B8", "#CD7F32"] as const;

const PODIUM_ORDER  = [1, 0, 2] as const; // 2nd · 1st · 3rd
const BAR_H         = [64, 96, 48]         as const;
const AVATAR_SIZE   = ["w-14 h-14 text-base", "w-20 h-20 text-xl", "w-14 h-14 text-base"] as const;

function trendIcon(t: "up" | "down" | "stable") {
  if (t === "up")     return <TrendingUp   size={11} className="text-emerald-400" />;
  if (t === "down")   return <TrendingDown size={11} className="text-red-400"     />;
  return                     <Minus        size={11} className="text-slate-400"   />;
}

function slaColor(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-red-400";
}

function rankDelta(current: number, prev: number) {
  const d = prev - current;
  if (d > 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400"><TrendingUp size={9} />{d}</span>;
  if (d < 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400"><TrendingDown size={9} />{Math.abs(d)}</span>;
  return <Minus size={9} className="opacity-30" />;
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function DetailModal({ entry, onClose }: { entry: DistrictOfficerEntry; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-5 border-b"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white"
              style={{ background: entry.avatarColor }}>{entry.initial}</div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">{entry.name}</h2>
              <p className="text-xs text-[var(--color-text-muted)]">{entry.designation} · {entry.district}</p>
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
                style={{ background: "rgba(20,184,166,0.15)", color: "#14b8a6" }}>
                Rank #{entry.rank}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center border text-[var(--color-text-muted)]"
            style={{ borderColor: "var(--color-border)" }}>
            <X size={14} />
          </button>
        </div>
        {/* Stats */}
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Cases Resolved",   value: String(entry.casesResolved),                       color: "text-emerald-400" },
              { label: "SLA Score",         value: `${entry.slaScore}%`,                             color: slaColor(entry.slaScore) },
              { label: "Escalations Closed",value: String(entry.escalationsClosed),                  color: "text-orange-400" },
              { label: "Governance Score",  value: `${entry.governanceScore}%`,                      color: "text-cyan-400"   },
              { label: "Evidence Verified", value: String(entry.evidenceVerified),                   color: "text-purple-400" },
              { label: "Avg Resolution",    value: `${entry.resolutionSpeedDays}d`,                  color: "text-amber-400"  },
            ].map(c => (
              <div key={c.label} className="rounded-xl border p-3 flex flex-col gap-1"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <span className="text-[10px] text-[var(--color-text-muted)]">{c.label}</span>
                <span className={`text-base font-black font-mono ${c.color}`}>{c.value}</span>
              </div>
            ))}
          </div>
          {/* Points progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Total Points</span>
              <span className="text-sm font-black font-mono" style={{ color: "#14b8a6" }}>{entry.points.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (entry.points / 33600) * 100)}%` }}
                transition={{ duration: 0.8 }} className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #14b8a6, #06b6d4)" }} />
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">+{entry.pointsDeltaWeek} pts this week</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Podium ───────────────────────────────────────────────────────────────────

function Podium({ top3, onSelect }: { top3: DistrictOfficerEntry[]; onSelect: (e: DistrictOfficerEntry) => void }) {
  return (
    <DashboardCard className="overflow-hidden">
      <div className="relative px-4 pt-10 pb-0"
        style={{ background: "linear-gradient(160deg, var(--color-surface) 0%, var(--color-page) 100%)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(20,184,166,0.18) 0%, transparent 80%)" }} />
        <div className="relative flex items-end justify-center gap-4 sm:gap-8">
          {PODIUM_ORDER.map((dataIdx, podiumSlot) => {
            const e   = top3[dataIdx];
            const bar = BAR_H[podiumSlot];
            const av  = AVATAR_SIZE[podiumSlot];
            const ring = RING[dataIdx];
            const isFirst = dataIdx === 0;
            if (!e) return null;
            return (
              <motion.button key={dataIdx}
                initial={{ opacity: 0, y: isFirst ? -20 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 20, delay: podiumSlot * 0.12 }}
                onClick={() => onSelect(e)}
                className={`flex flex-col items-center flex-1 max-w-[140px] ${isFirst ? "" : "translate-y-4"}`}>
                <span className={`mb-1 leading-none ${isFirst ? "text-3xl" : "text-2xl"}`}>{MEDAL[dataIdx]}</span>
                <div className="relative">
                  {isFirst && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <Crown size={22} fill="#14b8a6" stroke="#06b6d4" strokeWidth={1.5} />
                    </motion.div>
                  )}
                  <div className={`relative ${av} rounded-full flex items-center justify-center font-black text-white`}
                    style={{ background: e.avatarColor, border: `3px solid ${ring}`, boxShadow: `0 0 20px ${ring}40` }}>
                    {e.initial}
                  </div>
                </div>
                <div className="mt-3 text-center px-1 w-full">
                  <p className={`font-bold truncate max-w-[110px] ${isFirst ? "text-sm" : "text-xs"} text-[var(--color-text-primary)]`}>
                    {e.name}
                  </p>
                  <p className={`font-black tabular-nums font-mono ${isFirst ? "text-base" : "text-sm"}`} style={{ color: "#14b8a6" }}>
                    {e.points.toLocaleString()} pts
                  </p>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1"
                    style={{ background: "rgba(34,197,94,0.15)", color: "var(--color-success)" }}>
                    +{e.pointsDeltaWeek}
                  </span>
                </div>
                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22, delay: podiumSlot * 0.1 + 0.2 }}
                  style={{ height: bar, transformOrigin: "bottom", borderTop: `2px solid ${ring}40`, background: `linear-gradient(180deg, ${ring}25 0%, transparent 100%)` }}
                  className="w-full rounded-t-xl mt-3" />
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
        <span className="text-xs text-[var(--color-text-muted)]">Top 3 District Officers</span>
        <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
          <RefreshCw size={11} /> Live rankings
        </span>
      </div>
    </DashboardCard>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

function LeaderboardTable({
  entries,
  onSelect,
}: {
  entries: DistrictOfficerEntry[];
  onSelect: (e: DistrictOfficerEntry) => void;
}) {
  const headers = ["Rank", "Officer", "Designation", "Cases", "SLA", "Escalations", "Points", "Trend", ""];

  return (
    <DashboardCard className="flex flex-col">
      <div className="dashboard-table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>{headers.map(h => <th key={h} className="dashboard-table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {entries.slice(3).map((e, i) => (
              <motion.tr key={e.rank}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                className="dashboard-table-row cursor-pointer hover:bg-[var(--color-surface)]"
                style={e.isCurrentUser ? { background: "rgba(20,184,166,0.05)", borderLeft: "3px solid #14b8a6" } : {}}
                onClick={() => onSelect(e)}>
                {/* Rank */}
                <td className="dashboard-table-td">
                  <div className="flex flex-col items-center w-8">
                    <span className={`text-sm font-black tabular-nums font-mono ${e.isCurrentUser ? "text-teal-400" : "text-[var(--color-text-muted)]"}`}>{e.rank}</span>
                    {rankDelta(e.rank, e.prevRank)}
                  </div>
                </td>
                {/* Officer */}
                <td className="dashboard-table-td">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ background: e.avatarColor, boxShadow: e.isCurrentUser ? "0 0 0 2px #14b8a6" : undefined }}>
                      {e.initial}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${e.isCurrentUser ? "text-teal-400" : "text-[var(--color-text-primary)]"}`}>
                        {e.name}{e.isCurrentUser && <span className="ml-1 text-[10px] opacity-70">(You)</span>}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{e.district}</p>
                    </div>
                  </div>
                </td>
                {/* Designation */}
                <td className="dashboard-table-td text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{e.designation}</td>
                {/* Cases */}
                <td className="dashboard-table-td">
                  <span className="text-sm font-bold tabular-nums text-emerald-400">{e.casesResolved}</span>
                </td>
                {/* SLA */}
                <td className="dashboard-table-td">
                  <div className="flex flex-col gap-1 min-w-[60px]">
                    <span className={`text-xs font-bold tabular-nums ${slaColor(e.slaScore)}`}>{e.slaScore}%</span>
                    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${e.slaScore}%`, background: e.slaScore >= 85 ? "#10b981" : e.slaScore >= 70 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                  </div>
                </td>
                {/* Escalations */}
                <td className="dashboard-table-td">
                  <span className="text-sm font-bold tabular-nums text-orange-400">{e.escalationsClosed}</span>
                </td>
                {/* Points */}
                <td className="dashboard-table-td">
                  <span className="text-sm font-black tabular-nums font-mono" style={{ color: "#14b8a6" }}>{e.points.toLocaleString()}</span>
                </td>
                {/* Trend */}
                <td className="dashboard-table-td">{trendIcon(e.trend)}</td>
                {/* Detail */}
                <td className="dashboard-table-td">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={ev => { ev.stopPropagation(); onSelect(e); }}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-medium"
                    style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
                    <ArrowUpRight size={11} /> View
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
        <span className="text-[11px] text-[var(--color-text-muted)]">Showing {entries.slice(3).length} officers · Ranks 4–{entries.length}</span>
      </div>
    </DashboardCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DistrictLeaderboardPage() {
  const { districtOfficers } = useLeaderboardStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [selected,   setSelected]   = useState<DistrictOfficerEntry | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const top3 = districtOfficers.slice(0, 3);
  const champion = top3[0];

  const totalResolved     = districtOfficers.reduce((s, e) => s + e.casesResolved, 0);
  const avgSla            = Math.round(districtOfficers.reduce((s, e) => s + e.slaScore, 0) / districtOfficers.length);
  const totalEscalations  = districtOfficers.reduce((s, e) => s + e.escalationsClosed, 0);

  const TIME_LABELS: Record<TimeFilter, string> = {
    "all-time": "All Time", "this-month": "This Month", "this-week": "This Week",
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-teal-400 shrink-0" />
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">District Leaderboard</h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Performance rankings for district-level officers and admins
          </p>
        </div>
        {/* Time filter */}
        <div className="relative">
          <button onClick={() => setFilterOpen(p => !p)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border text-xs font-semibold transition-all"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
            <Clock size={13} /> {TIME_LABELS[timeFilter]}
            <motion.span animate={{ rotate: filterOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.span>
          </button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 w-36 rounded-xl border overflow-hidden z-40"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                {(["all-time","this-month","this-week"] as TimeFilter[]).map(t => (
                  <button key={t} onClick={() => { setTimeFilter(t); setFilterOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-xs transition-colors"
                    style={{
                      background: t === timeFilter ? "rgba(20,184,166,0.1)" : "transparent",
                      color: t === timeFilter ? "#14b8a6" : "var(--color-text-secondary)",
                    }}>
                    {TIME_LABELS[t]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Champion banner */}
      {champion && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <DashboardCard className="p-4 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.08), var(--color-card))", borderColor: "rgba(20,184,166,0.2)" }}>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-black text-xl text-white"
              style={{ background: champion.avatarColor, boxShadow: "0 0 24px rgba(20,184,166,0.35)" }}>
              {champion.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Crown size={16} fill="#14b8a6" stroke="#06b6d4" strokeWidth={1.5} />
                <span className="text-sm font-bold text-teal-400">District Champion</span>
                <span className="dashboard-table-badge dashboard-table-badge-status-resolved">#{champion.rank}</span>
              </div>
              <p className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">{champion.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{champion.designation} · {champion.district}</p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-1">
              <span className="text-xl font-black font-mono text-teal-400">{champion.points.toLocaleString()}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">pts · SLA {champion.slaScore}%</span>
            </div>
          </DashboardCard>
        </motion.div>
      )}

      {/* KPI strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Officers Ranked",     value: String(districtOfficers.length), color: "text-cyan-400"    },
          { label: "Cases Resolved",      value: totalResolved.toLocaleString(),  color: "text-emerald-400" },
          { label: "Avg SLA Score",       value: `${avgSla}%`,                   color: "text-amber-400"   },
          { label: "Escalations Closed",  value: String(totalEscalations),        color: "text-orange-400"  },
        ].map(s => (
          <DashboardCard key={s.label} className="flex flex-col items-center justify-center py-4 px-3 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.label}</span>
          </DashboardCard>
        ))}
      </motion.div>

      {/* Podium */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Podium top3={top3} onSelect={setSelected} />
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <LeaderboardTable entries={districtOfficers} onSelect={setSelected} />
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
