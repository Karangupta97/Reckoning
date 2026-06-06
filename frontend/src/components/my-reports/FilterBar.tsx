"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import type { FilterTab, SortOption, HazardType, Severity } from "./types";

/* ─── Types ───────────────────────────────────────────────────── */
interface FilterBarProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  tabCounts: Record<FilterTab, number>;
  // Advanced filters
  severityFilter: Severity | "all";
  onSeverityChange: (s: Severity | "all") => void;
  hazardFilter: HazardType | "all";
  onHazardChange: (h: HazardType | "all") => void;
}

/* ─── Tab Config ──────────────────────────────────────────────── */
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "rejected", label: "Rejected" },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "oldest", label: "Oldest" },
  { key: "severity", label: "Severity" },
  { key: "status", label: "Status" },
];

const SEVERITY_OPTIONS: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"];
const HAZARD_OPTIONS: { key: HazardType | "all"; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "📍" },
  { key: "pothole", label: "Pothole", emoji: "🕳" },
  { key: "flooding", label: "Flood", emoji: "🌊" },
  { key: "accident", label: "Accident", emoji: "⚠️" },
  { key: "debris", label: "Debris", emoji: "🌳" },
  { key: "signal", label: "Signal", emoji: "🚦" },
];

/* ─── FilterBar Component ─────────────────────────────────────── */
export function FilterBar({
  activeTab,
  onTabChange,
  sortOption,
  onSortChange,
  searchQuery,
  onSearchChange,
  tabCounts,
  severityFilter,
  onSeverityChange,
  hazardFilter,
  onHazardChange,
}: FilterBarProps) {
  const [showSort, setShowSort] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      {/* Tab Row */}
      <LayoutGroup>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory">
          {TABS.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`relative flex-shrink-0 snap-center px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[var(--color-amber)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-[var(--color-amber)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {tab.label} ({tabCounts[tab.key]})
              </span>
            </motion.button>
          ))}
        </div>
      </LayoutGroup>

      {/* Search + Sort Row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-amber)] transition-colors"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] transition-colors"
          >
            <span>Sort</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 z-50 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-neu-lg)] p-1.5 min-w-[120px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { onSortChange(opt.key); setShowSort(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      sortOption === opt.key
                        ? "bg-[var(--color-amber)] text-white"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilterSheet(true)}
          className="flex items-center gap-1 px-3 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 3v18M3 7.5h18M6 12h12M9 16.5h6" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Filter Sheet / Popover */}
      <AnimatePresence>
        {showFilterSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterSheet(false)}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            />
            {/* Sheet (mobile: bottom, desktop: popover) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] rounded-t-2xl border-t border-[var(--color-border)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:absolute lg:static lg:bottom-auto lg:left-auto lg:right-0 lg:top-auto lg:rounded-2xl lg:border lg:shadow-[var(--shadow-neu-lg)] lg:max-w-sm lg:z-50"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mb-4 lg:hidden" />

              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                Filter Reports
              </p>

              {/* Severity */}
              <div className="mb-4">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">Severity</p>
                <div className="flex flex-wrap gap-2">
                  {SEVERITY_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSeverityChange(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                        severityFilter === s
                          ? "bg-[var(--color-amber)] text-white"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hazard Type */}
              <div className="mb-5">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">Hazard Type</p>
                <div className="flex flex-wrap gap-2">
                  {HAZARD_OPTIONS.map((h) => (
                    <button
                      key={h.key}
                      onClick={() => onHazardChange(h.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        hazardFilter === h.key
                          ? "bg-[var(--color-amber)] text-white"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {h.emoji} {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSeverityChange("all");
                    onHazardChange("all");
                    setShowFilterSheet(false);
                  }}
                  className="flex-1 py-2.5 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="flex-1 py-2.5 rounded-full bg-[var(--color-amber)] text-white text-xs font-medium hover:bg-[var(--color-amber)]/90 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
