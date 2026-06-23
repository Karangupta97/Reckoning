"use client";

import { useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, BadgeCheck,
  ChevronRight, ChevronDown,
  ClipboardList, CheckCircle, Wrench, Flame, Trophy,
} from "lucide-react";
import type { AnyEntry, LeaderboardView } from "@/types/leaderboard";
import { isCitizenEntry } from "@/types/leaderboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankedListProps {
  entries: AnyEntry[];
  view: LeaderboardView;
  totalCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (entry: AnyEntry) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  highlightUserId: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entryId(e: AnyEntry): string {
  return `${e.rank}-${e.name}`;
}

// ─── RankDelta ────────────────────────────────────────────────────────────────

function RankDelta({ current, prev }: { current: number; prev: number }) {
  const diff = prev - current;
  if (diff > 0) {
    return (
      <span
        className="flex items-center gap-0.5 text-[10px] font-bold"
        style={{ color: "var(--color-success)" }}
        aria-label={`Up ${diff}`}
      >
        <TrendingUp size={9} strokeWidth={2.5} />
        {diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span
        className="flex items-center gap-0.5 text-[10px] font-bold"
        style={{ color: "var(--color-danger)" }}
        aria-label={`Down ${Math.abs(diff)}`}
      >
        <TrendingDown size={9} strokeWidth={2.5} />
        {Math.abs(diff)}
      </span>
    );
  }
  return (
    <Minus
      size={9}
      strokeWidth={2}
      className="opacity-30"
      aria-label="No change"
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function RowAvatar({
  initial,
  color,
  isCurrentUser,
}: {
  initial: string;
  color: string;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 relative"
      style={{
        background: color,
        boxShadow: isCurrentUser
          ? "0 0 0 2px var(--color-amber), 0 0 12px rgba(245,158,11,0.28)"
          : undefined,
      }}
      aria-hidden="true"
    >
      {initial}
      {isCurrentUser && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
          style={{
            background: "var(--color-amber)",
            borderColor: "var(--color-card)",
          }}
        />
      )}
    </div>
  );
}

// ─── Expand strip ─────────────────────────────────────────────────────────────

function ExpandStrip({ entry }: { entry: AnyEntry }) {
  if (!isCitizenEntry(entry)) return null;

  const chips = [
    { label: "Submitted", value: entry.totalReports, icon: <ClipboardList size={11} style={{ color: "var(--color-info)" }} /> },
    { label: "Verified", value: entry.validationCount, icon: <CheckCircle size={11} style={{ color: "var(--color-success)" }} /> },
    { label: "Resolved", value: entry.resolvedCount, icon: <Wrench size={11} style={{ color: "var(--color-amber)" }} /> },
    { label: "Streak", value: `${entry.streak}d`, icon: <Flame size={11} style={{ color: "var(--color-danger)" }} /> },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div
        className="flex gap-2 flex-wrap px-4 py-3 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        {chips.map((chip) => (
          <div
            key={chip.label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            {chip.icon}
            <span style={{ color: "var(--color-text-muted)" }}>{chip.label}</span>
            <span className="font-bold font-mono" style={{ color: "var(--color-text-primary)" }}>
              {chip.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── ListRow ──────────────────────────────────────────────────────────────────

const listItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22 } },
};

function ListRow({
  entry,
  view,
  isExpanded,
  isHighlighted,
  rowRef,
  onSelect,
  onToggle,
}: {
  entry: AnyEntry;
  view: LeaderboardView;
  isExpanded: boolean;
  isHighlighted: boolean;
  rowRef?: React.Ref<HTMLDivElement>;
  onSelect: (e: AnyEntry) => void;
  onToggle: () => void;
}) {
  const isMe = entry.isCurrentUser;
  const id = entryId(entry);

  return (
    <motion.div
      ref={rowRef}
      variants={listItemVariants}
      layout
      className="rounded-xl border overflow-hidden transition-all duration-150"
      style={{
        borderLeft: isMe ? "4px solid var(--color-amber)" : undefined,
        background: isMe
          ? "color-mix(in srgb, var(--color-amber) 5%, var(--color-card))"
          : isHighlighted
            ? "color-mix(in srgb, var(--color-amber) 8%, var(--color-card))"
            : "var(--color-card)",
        borderColor: isHighlighted
          ? "var(--color-amber)"
          : isMe
            ? "var(--color-amber)"
            : "var(--color-border)",
        boxShadow: isHighlighted
          ? "0 0 0 2px rgba(245,158,11,0.4)"
          : undefined,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 py-3 px-4">
        {/* Rank + delta */}
        <div className="w-10 flex flex-col items-center flex-shrink-0">
          <span
            className="text-sm font-black tabular-nums font-mono leading-none"
            style={{ color: isMe ? "var(--color-amber)" : "var(--color-text-muted)" }}
          >
            {entry.rank}
          </span>
          <RankDelta current={entry.rank} prev={entry.prevRank} />
        </div>

        {/* Avatar */}
        <RowAvatar initial={entry.initial} color={entry.avatarColor} isCurrentUser={isMe} />

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: isMe ? "var(--color-amber)" : "var(--color-text-primary)" }}
            >
              {entry.name}
            </span>
            {isMe && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--color-amber) 18%, transparent)",
                  color: "var(--color-amber)",
                }}
              >
                You
              </span>
            )}
            {isCitizenEntry(entry) && entry.isVerifiedUser && (
              <BadgeCheck size={12} style={{ color: "var(--color-info)" }} aria-label="Verified" />
            )}
          </div>

          {/* Location / sub-meta */}
          {view === "citizen" && isCitizenEntry(entry) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {entry.district}
              </span>
              <span className="text-[11px] hidden sm:inline" style={{ color: "var(--color-text-muted)" }}>
                · {entry.reports} reports
              </span>
            </div>
          )}
          {view !== "citizen" && !isCitizenEntry(entry) && (
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              {entry.district} · {entry.role}
            </span>
          )}
        </div>

        {/* Points */}
        <div className="w-20 text-right flex-shrink-0">
          {view === "citizen" && isCitizenEntry(entry) ? (
            <span
              className="text-sm font-black tabular-nums font-mono text-[var(--color-amber)]"
            >
              {entry.points.toLocaleString()}
            </span>
          ) : !isCitizenEntry(entry) ? (
            <span
              className="text-sm font-black tabular-nums font-mono text-[var(--color-success)]"
            >
              {entry.issuesResolved}
            </span>
          ) : null}
        </div>

        {/* Reputation */}
        <div className="w-16 text-right flex-shrink-0 hidden sm:block">
          {view === "citizen" && isCitizenEntry(entry) ? (
            <span
              className="text-sm font-semibold tabular-nums font-mono text-[var(--color-text-secondary)]"
            >
              {entry.reputation}
            </span>
          ) : !isCitizenEntry(entry) ? (
            <span
              className="text-xs font-semibold tabular-nums font-mono text-[var(--color-text-secondary)]"
            >
              {entry.validationAccuracy}%
            </span>
          ) : null}
        </div>

        {/* Expand chevron */}
        {isCitizenEntry(entry) ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
            aria-expanded={isExpanded}
            aria-controls={`expand-${id}`}
          >
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="block"
            >
              <ChevronDown size={14} />
            </motion.span>
          </button>
        ) : (
          <button
            onClick={() => onSelect(entry)}
            className="w-7 h-7 flex items-center justify-center"
            style={{ color: "var(--color-text-muted)" }}
            aria-label={`View details for ${entry.name}`}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Expand strip */}
      {isCitizenEntry(entry) && (
        <AnimatePresence>
          {isExpanded && (
            <div id={`expand-${id}`}>
              <ExpandStrip entry={entry} />
            </div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

// ─── YourRankStyleRow — mirrors YourRankCard height for the last row ──────────

function YourRankStyleRow({
  entry,
  view,
  isExpanded,
  isHighlighted,
  rowRef,
  onSelect,
  onToggle,
}: {
  entry: AnyEntry;
  view: LeaderboardView;
  isExpanded: boolean;
  isHighlighted: boolean;
  rowRef?: React.Ref<HTMLDivElement>;
  onSelect: (e: AnyEntry) => void;
  onToggle: () => void;
}) {
  const isMe = entry.isCurrentUser;
  const id = entryId(entry);

  const points = isCitizenEntry(entry) ? entry.points : entry.issuesResolved;
  const maxPoints = isCitizenEntry(entry) ? 8450 : 320;
  const pct = Math.min(100, Math.round((points / maxPoints) * 100));
  const metaLine = isCitizenEntry(entry)
    ? `${entry.district} · ${entry.reports} reports`
    : `${entry.district} · ${entry.role}`;

  return (
    <motion.div
      ref={rowRef}
      variants={listItemVariants}
      layout
      className="rounded-xl border overflow-hidden transition-all duration-150"
      style={{
        borderLeft: isMe ? "4px solid var(--color-amber)" : undefined,
        background: isMe
          ? "color-mix(in srgb, var(--color-amber) 5%, var(--color-card))"
          : isHighlighted
            ? "color-mix(in srgb, var(--color-amber) 8%, var(--color-card))"
            : "var(--color-card)",
        borderColor: isHighlighted
          ? "var(--color-amber)"
          : isMe
            ? "var(--color-amber)"
            : "var(--color-border)",
        boxShadow: isHighlighted ? "0 0 0 2px rgba(245,158,11,0.4)" : undefined,
      }}
    >
      <div className="p-4">
        {/* Top: rank + avatar + name row — same as normal row */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          {/* Rank + delta */}
          <div className="w-10 flex flex-col items-center flex-shrink-0">
            <span
              className="text-sm font-black tabular-nums font-mono leading-none"
              style={{ color: isMe ? "var(--color-amber)" : "var(--color-text-muted)" }}
            >
              {entry.rank}
            </span>
            <RankDelta current={entry.rank} prev={entry.prevRank} />
          </div>

          {/* Avatar */}
          <RowAvatar initial={entry.initial} color={entry.avatarColor} isCurrentUser={isMe} />

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-sm font-semibold truncate"
                style={{ color: isMe ? "var(--color-amber)" : "var(--color-text-primary)" }}
              >
                {entry.name}
              </span>
              {isMe && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "color-mix(in srgb, var(--color-amber) 18%, transparent)",
                    color: "var(--color-amber)",
                  }}
                >
                  You
                </span>
              )}
              {isCitizenEntry(entry) && entry.isVerifiedUser && (
                <BadgeCheck size={12} style={{ color: "var(--color-info)" }} aria-label="Verified" />
              )}
            </div>
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              {metaLine}
            </span>
          </div>

          {/* Points value */}
          <div className="w-20 text-right flex-shrink-0">
            <span
              className="text-sm font-black tabular-nums font-mono text-[#F59E0B]"
            >
              {points.toLocaleString()}
            </span>
          </div>

          {/* Reputation / Acc */}
          <div className="w-16 text-right flex-shrink-0 hidden sm:block">
            <span
              className="text-sm font-semibold tabular-nums font-mono text-gray-500"
            >
              {isCitizenEntry(entry) ? entry.reputation : `${entry.validationAccuracy}%`}
            </span>
          </div>

          {/* Expand / detail chevron */}
          {isCitizenEntry(entry) ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
              style={{ color: "var(--color-text-muted)" }}
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
              aria-expanded={isExpanded}
              aria-controls={`expand-${id}`}
            >
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                <ChevronDown size={14} />
              </motion.span>
            </button>
          ) : (
            <button
              onClick={() => onSelect(entry)}
              className="w-7 h-7 flex items-center justify-center flex-shrink-0"
              style={{ color: "var(--color-text-muted)" }}
              aria-label={`View details for ${entry.name}`}
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Bottom: rank progress bar — mirrors YourRankCard XP bar */}
        <div
          className="pt-3 border-t space-y-1.5"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy size={10} style={{ color: "var(--color-amber)" }} aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                {isCitizenEntry(entry) ? "Points" : "Resolved"}
              </span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
              {pct}% of top
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--color-border)" }}
            role="progressbar"
            aria-valuenow={points}
            aria-valuemin={0}
            aria-valuemax={maxPoints}
            aria-label={`${pct}% of top score`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--color-amber), #F97316)" }}
            />
          </div>
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            <span className="font-mono font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              {(maxPoints - points).toLocaleString()}
            </span>{" "}
            {isCitizenEntry(entry) ? "XP" : "more"} to reach #1
          </p>
        </div>
      </div>

      {/* Expand strip */}
      {isCitizenEntry(entry) && (
        <AnimatePresence>
          {isExpanded && (
            <div id={`expand-${id}`}>
              <ExpandStrip entry={entry} />
            </div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

// ─── RankedList ───────────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

export function RankedList({
  entries,
  view,
  totalCount,
  hasMore,
  onLoadMore,
  onSelect,
  expandedId,
  onToggleExpand,
  highlightUserId,
}: RankedListProps) {
  const meRowRef = useRef<HTMLDivElement | null>(null);

  const setMeRef = useCallback((el: HTMLDivElement | null) => {
    meRowRef.current = el;
  }, []);

  // Expose scroll-into-view via custom event (driven by parent)
  useEffect(() => {
    const handler = () => {
      meRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("leaderboard:highlightMe", handler);
    return () => window.removeEventListener("leaderboard:highlightMe", handler);
  }, []);

  return (
    <div>
      {/* Rows */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-1.5"
      >
        <AnimatePresence mode="popLayout">
          {entries.map((entry, idx) => {
            const id = entryId(entry);
            const isMe = entry.isCurrentUser;
            const isHighlighted = highlightUserId !== null && isMe;
            const isLast = idx === entries.length - 1;
            const sharedProps = {
              entry,
              view,
              isExpanded: expandedId === id,
              isHighlighted,
              rowRef: isMe ? setMeRef : undefined,
              onSelect,
              onToggle: () => onToggleExpand(id),
            };

            return isLast ? (
              <YourRankStyleRow key={id} {...sharedProps} />
            ) : (
              <ListRow key={id} {...sharedProps} />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onLoadMore}
            className="btn-outline px-6 py-2 rounded-xl text-sm font-medium"
          >
            Load more ({totalCount - entries.length - 3} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
