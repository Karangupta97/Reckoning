"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import type { MyReport, FilterTab, SortOption, HazardType, Severity } from "./types";
import { MOCK_MY_REPORTS, MOCK_STATS } from "./mockData";
import { StatsOverview, StatsTicker } from "./StatsOverview";
import { FilterBar } from "./FilterBar";
import { ReportListCard } from "./ReportListCard";
import { ReportDetailSheet, DesktopDetailPanel } from "./ReportDetailSheet";
import { ExportButton } from "./ExportButton";
import { EmptyState } from "./EmptyState";

/* ─── Status ordering for sort ────────────────────────────────── */
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

/* ─── MyReportsPage Component ─────────────────────────────────── */
export function MyReportsPage() {
  // State
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [hazardFilter, setHazardFilter] = useState<HazardType | "all">("all");
  const [selectedReport, setSelectedReport] = useState<MyReport | null>(null);
  const [reports, setReports] = useState<MyReport[]>(MOCK_MY_REPORTS);

  // Tab counts
  const tabCounts = useMemo(() => {
    const all = reports.length;
    const open = reports.filter((r) => ["submitted", "verified", "assigned"].includes(r.status)).length;
    const inProgress = reports.filter((r) => r.status === "in_progress").length;
    const resolved = reports.filter((r) => r.status === "resolved").length;
    const rejected = reports.filter((r) => r.status === "rejected").length;
    return { all, open, in_progress: inProgress, resolved, rejected } as Record<FilterTab, number>;
  }, [reports]);

  // Filtered & sorted reports
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Tab filter
    if (activeTab === "open") {
      result = result.filter((r) => ["submitted", "verified", "assigned"].includes(r.status));
    } else if (activeTab !== "all") {
      result = result.filter((r) => r.status === activeTab);
    }

    // Severity filter
    if (severityFilter !== "all") {
      result = result.filter((r) => r.severity === severityFilter);
    }

    // Hazard filter
    if (hazardFilter !== "all") {
      result = result.filter((r) => r.hazardType === hazardFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.reportId.toLowerCase().includes(q) ||
          r.location.name.toLowerCase().includes(q) ||
          r.location.road.toLowerCase().includes(q) ||
          r.hazardType.includes(q)
      );
    }

    // Sort
    switch (sortOption) {
      case "latest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "severity":
        result.sort((a, b) => (SEVERITY_ORDER[a.severity] || 5) - (SEVERITY_ORDER[b.severity] || 5));
        break;
      case "status":
        result.sort((a, b) => (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0));
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

  const handleDelete = useCallback((report: MyReport) => {
    setReports((prev) => prev.filter((r) => r.id !== report.id));
    setSelectedReport(null);
  }, []);

  const handleToggleNotify = useCallback((report: MyReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, isNotifying: !r.isNotifying } : r))
    );
    if (selectedReport?.id === report.id) {
      setSelectedReport((prev) => prev ? { ...prev, isNotifying: !prev.isNotifying } : null);
    }
  }, [selectedReport]);

  const handleClearFilters = useCallback(() => {
    setActiveTab("all");
    setSearchQuery("");
    setSeverityFilter("all");
    setHazardFilter("all");
  }, []);

  const hasFilters = activeTab !== "all" || searchQuery !== "" || severityFilter !== "all" || hazardFilter !== "all";

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left Stats Panel (desktop only) */}
      <div className="hidden lg:block px-4 pt-4 overflow-y-auto">
        <StatsOverview stats={MOCK_STATS} />
      </div>

      {/* Center Column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-[var(--color-card)]/95 backdrop-blur-md border-b border-[var(--color-border)]">
          <div className="px-4 sm:px-6 py-3">
            {/* Top row: title + actions */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                  My Reports
                </h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Track your submitted road hazard reports
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ExportButton reports={filteredReports} />
                <a
                  href="/dashboard/report"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-amber)] text-white text-xs font-medium hover:bg-[var(--color-amber)]/90 transition-colors shadow-[var(--shadow-fab)]"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">New Report</span>
                </a>
              </div>
            </div>

            {/* Stats ticker (mobile) */}
            <div className="mt-3 lg:hidden">
              <StatsTicker stats={MOCK_STATS} />
            </div>

            {/* Filter bar */}
            <div className="mt-3">
              <FilterBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sortOption={sortOption}
                onSortChange={setSortOption}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                tabCounts={tabCounts}
                severityFilter={severityFilter}
                onSeverityChange={setSeverityFilter}
                hazardFilter={hazardFilter}
                onHazardChange={setHazardFilter}
              />
            </div>
          </div>
        </div>

        {/* Report Cards List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-6">
          {filteredReports.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClearFilters={handleClearFilters} />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report) => (
                  <motion.div
                    key={report.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    exit={{ opacity: 0, x: -50 }}
                    layout
                  >
                    <ReportListCard
                      report={report}
                      onSelect={handleSelectReport}
                      onShare={() => {
                        const url = `${window.location.origin}/report/${report.id}`;
                        if (navigator.share) {
                          navigator.share({ title: report.title, url });
                        } else {
                          navigator.clipboard.writeText(url);
                        }
                      }}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Detail Panel (desktop) */}
      <DesktopDetailPanel
        report={selectedReport}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
        onToggleNotify={handleToggleNotify}
      />

      {/* Bottom Sheet Detail (mobile/tablet) */}
      <ReportDetailSheet
        report={selectedReport}
        onClose={handleCloseDetail}
        onDelete={handleDelete}
        onToggleNotify={handleToggleNotify}
      />
    </div>
  );
}
