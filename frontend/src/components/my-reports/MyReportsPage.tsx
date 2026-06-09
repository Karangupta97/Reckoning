"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { MyReport, FilterTab, SortOption, HazardType, Severity } from "./types";
import { ReportSidebar } from "./ReportSidebar";
import { ReportCard } from "./ReportCard";
import { ReportDetailSheet, DesktopDetailPanel } from "./ReportDetailSheet";
import { ExportButton } from "./ExportButton";
import { EmptyState } from "./EmptyState";
import { useMyReports } from "@/hooks/useMyReports";
import { useAuthStore } from "@/stores/authStore";

/* ─── Sort / Filter config ────────────────────────────────────── */
const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "latest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "severity", label: "Highest Risk" },
  { key: "status", label: "Status" },
];

const STATUS_ORDER: Record<string, number> = {
  submitted: 1,
  verified: 2,
  assigned: 3,
  in_progress: 4,
  resolved: 5,
  rejected: 6,
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

/* ─── Stat pill config ────────────────────────────────────────── */
interface StatPillConfig {
  key: FilterTab;
  label: string;
  borderColor: string;
  icon: React.ReactNode;
}

const STAT_PILLS: StatPillConfig[] = [
  {
    key: "all",
    label: "All",
    borderColor: "var(--color-amber)",
    icon: <FileText size={14} />,
  },
  {
    key: "open",
    label: "Open",
    borderColor: "var(--color-info)",
    icon: <Clock size={14} />,
  },
  {
    key: "in_progress",
    label: "In Progress",
    borderColor: "#F97316",
    icon: <AlertTriangle size={14} />,
  },
  {
    key: "resolved",
    label: "Resolved",
    borderColor: "var(--color-success)",
    icon: <CheckCircle2 size={14} />,
  },
  {
    key: "rejected",
    label: "Rejected",
    borderColor: "var(--color-danger)",
    icon: <XCircle size={14} />,
  },
];

const HAZARD_OPTIONS: { key: HazardType | "all"; label: string }[] = [
  { key: "all", label: "All Hazards" },
  { key: "pothole", label: "Pothole" },
  { key: "flooding", label: "Flooding" },
  { key: "accident", label: "Accident" },
  { key: "debris", label: "Debris" },
  { key: "signal", label: "Signal" },
];

const SEVERITY_OPTIONS: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"];

/* ─── Sort Dropdown ──────────────────────────────────────────── */
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors border"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        <span>{current?.label ?? "Sort"}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 rounded-xl border p-1.5 min-w-[140px]"
              style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                boxShadow: "var(--shadow-neu-lg)",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor:
                      value === opt.key ? "var(--color-amber)" : "transparent",
                    color: value === opt.key ? "white" : "var(--color-text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Filter Popover ──────────────────────────────────────────── */
function FilterPopover({
  hazardFilter,
  onHazardChange,
  severityFilter,
  onSeverityChange,
  hasActiveFilters,
  onClear,
}: {
  hazardFilter: HazardType | "all";
  onHazardChange: (v: HazardType | "all") => void;
  severityFilter: Severity | "all";
  onSeverityChange: (v: Severity | "all") => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors border relative"
        style={{
          backgroundColor: hasActiveFilters
            ? "color-mix(in srgb, var(--color-amber) 12%, var(--color-surface))"
            : "var(--color-surface)",
          borderColor: hasActiveFilters ? "var(--color-amber)" : "var(--color-border)",
          color: hasActiveFilters ? "var(--color-amber)" : "var(--color-text-secondary)",
        }}
      >
        <SlidersHorizontal size={13} />
        <span>Filter</span>
        {hasActiveFilters && (
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[0.5rem] font-bold flex items-center justify-center text-white"
            style={{ backgroundColor: "var(--color-amber)" }}
          >
            •
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 rounded-2xl border p-4 w-64"
              style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                boxShadow: "var(--shadow-neu-lg)",
              }}
            >
              {/* Hazard type */}
              <p
                className="text-[0.7rem] font-semibold mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                HAZARD TYPE
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {HAZARD_OPTIONS.map((h) => (
                  <button
                    key={h.key}
                    onClick={() => onHazardChange(h.key)}
                    className="px-2.5 py-1 rounded-full text-[0.65rem] font-medium transition-colors"
                    style={{
                      backgroundColor:
                        hazardFilter === h.key
                          ? "var(--color-amber)"
                          : "var(--color-surface)",
                      color:
                        hazardFilter === h.key ? "white" : "var(--color-text-secondary)",
                    }}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              {/* Severity */}
              <p
                className="text-[0.7rem] font-semibold mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                SEVERITY
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {SEVERITY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSeverityChange(s)}
                    className="px-2.5 py-1 rounded-full text-[0.65rem] font-medium capitalize transition-colors"
                    style={{
                      backgroundColor:
                        severityFilter === s ? "var(--color-amber)" : "var(--color-surface)",
                      color:
                        severityFilter === s ? "white" : "var(--color-text-secondary)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium btn-amber"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export function MyReportsPage() {
  const user = useAuthStore((state) => state.user);
  const { reports: fetchedReports, stats, isLoading } = useMyReports();

  // Filters
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [hazardFilter, setHazardFilter] = useState<HazardType | "all">("all");

  // Detail panel
  const [selectedReport, setSelectedReport] = useState<MyReport | null>(null);

  // Optimistic local mutations
  const [localReports, setLocalReports] = useState<MyReport[] | null>(null);
  const reports = localReports ?? fetchedReports;

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: reports.length,
      open: reports.filter((r) =>
        ["submitted", "verified", "assigned"].includes(r.status),
      ).length,
      in_progress: reports.filter((r) => r.status === "in_progress").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
    } as Record<FilterTab, number>;
  }, [reports]);

  // Filtered + sorted
  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (activeTab === "open") {
      result = result.filter((r) =>
        ["submitted", "verified", "assigned"].includes(r.status),
      );
    } else if (activeTab !== "all") {
      result = result.filter((r) => r.status === activeTab);
    }

    if (severityFilter !== "all") {
      result = result.filter((r) => r.severity === severityFilter);
    }

    if (hazardFilter !== "all") {
      result = result.filter((r) => r.hazardType === hazardFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.reportId.toLowerCase().includes(q) ||
          r.location.name.toLowerCase().includes(q) ||
          r.location.road.toLowerCase().includes(q) ||
          r.hazardType.includes(q),
      );
    }

    switch (sortOption) {
      case "latest":
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "severity":
        result.sort(
          (a, b) =>
            (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5),
        );
        break;
      case "status":
        result.sort(
          (a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0),
        );
        break;
    }

    return result;
  }, [reports, activeTab, sortOption, searchQuery, severityFilter, hazardFilter]);

  // Handlers
  const handleSelectReport = useCallback((report: MyReport) => {
    setSelectedReport(report);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedReport(null);
  }, []);

  const handleDelete = useCallback(
    (report: MyReport) => {
      setLocalReports((prev) =>
        (prev ?? fetchedReports).filter((r) => r.id !== report.id),
      );
      setSelectedReport(null);
    },
    [fetchedReports],
  );

  const handleToggleNotify = useCallback(
    (report: MyReport) => {
      setLocalReports((prev) =>
        (prev ?? fetchedReports).map((r) =>
          r.id === report.id ? { ...r, isNotifying: !r.isNotifying } : r,
        ),
      );
      if (selectedReport?.id === report.id) {
        setSelectedReport((prev) =>
          prev ? { ...prev, isNotifying: !prev.isNotifying } : null,
        );
      }
    },
    [fetchedReports, selectedReport],
  );

  const handleClearFilters = useCallback(() => {
    setActiveTab("all");
    setSearchQuery("");
    setSeverityFilter("all");
    setHazardFilter("all");
  }, []);

  const hasFilters =
    activeTab !== "all" ||
    searchQuery !== "" ||
    severityFilter !== "all" ||
    hazardFilter !== "all";

  const hasAdvancedFilters = severityFilter !== "all" || hazardFilter !== "all";

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* ── Left Sidebar (desktop only) ────────────────────────── */}
      <div className="hidden xl:flex flex-col overflow-y-auto overflow-x-hidden pt-6 pl-1">
        <ReportSidebar stats={stats} userName={user?.fullName} />
      </div>

      {/* ── Right Main Column ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header row */}
        <div
          className="flex-shrink-0 px-4 sm:px-6 pt-5 pb-3"
          style={{ backgroundColor: "var(--color-page)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                My Reports
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {isLoading
                  ? "Loading your reports…"
                  : `${stats.totalReports} reports submitted · ${stats.resolvedReports} resolved`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ExportButton reports={filteredReports} />
              <a
                href="/dashboard/report"
                className="btn-amber flex items-center gap-1.5 px-4 py-2.5 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Report</span>
              </a>
            </div>
          </div>

          {/* ── Stats strip: 5 pill cards ──────────────────────── */}
          <div className="grid grid-cols-5 gap-2 mt-4 max-[600px]:grid-cols-3">
            {STAT_PILLS.map((pill) => {
              const isActive = activeTab === pill.key;
              return (
                <motion.button
                  key={pill.key}
                  onClick={() => setActiveTab(pill.key)}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-start p-3 rounded-xl transition-all duration-200 text-left"
                  style={{
                    backgroundColor: isActive
                      ? `color-mix(in srgb, ${pill.borderColor} 8%, var(--color-card))`
                      : "var(--color-card)",
                    boxShadow: isActive ? "var(--shadow-neu)" : "none",
                    borderTop: `1px solid ${isActive ? `color-mix(in srgb, ${pill.borderColor} 20%, var(--color-border))` : "var(--color-border)"}`,
                    borderRight: `1px solid ${isActive ? `color-mix(in srgb, ${pill.borderColor} 20%, var(--color-border))` : "var(--color-border)"}`,
                    borderBottom: `1px solid ${isActive ? `color-mix(in srgb, ${pill.borderColor} 20%, var(--color-border))` : "var(--color-border)"}`,
                    borderLeft: `3px solid ${isActive ? pill.borderColor : "var(--color-border)"}`,
                  }}
                >
                  <span
                    className="text-xl font-bold leading-none tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: isActive ? pill.borderColor : "var(--color-text-primary)",
                    }}
                  >
                    {tabCounts[pill.key] ?? 0}
                  </span>
                  <span
                    className="text-[0.6rem] mt-1 leading-none"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {pill.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ── Search + Sort + Filter row ─────────────────────── */}
          <div className="flex items-center gap-2 mt-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search by title, ID, or location…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs border transition-colors"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: searchQuery ? "var(--color-amber)" : "var(--color-border)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <SortDropdown value={sortOption} onChange={setSortOption} />

            <FilterPopover
              hazardFilter={hazardFilter}
              onHazardChange={setHazardFilter}
              severityFilter={severityFilter}
              onSeverityChange={setSeverityFilter}
              hasActiveFilters={hasAdvancedFilters}
              onClear={() => {
                setHazardFilter("all");
                setSeverityFilter("all");
              }}
            />
          </div>
        </div>

        {/* ── Report Cards List (scrollable) ─────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-2 pb-8">
          {isLoading ? (
            /* Skeleton */
            <div className="space-y-4 mt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="neu-card-lg h-36 animate-pulse"
                  style={{ opacity: 0.5 }}
                />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClearFilters={handleClearFilters} />
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-4 mt-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onView={handleSelectReport}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Right Detail Panel (desktop) ───────────────────────── */}
      <DesktopDetailPanel
        report={selectedReport}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
        onToggleNotify={handleToggleNotify}
      />

      {/* ── Bottom Sheet Detail (mobile/tablet) ────────────────── */}
      <ReportDetailSheet
        report={selectedReport}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
        onToggleNotify={handleToggleNotify}
      />
    </div>
  );
}
