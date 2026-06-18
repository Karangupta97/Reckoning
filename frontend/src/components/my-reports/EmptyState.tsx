"use client";

import { motion } from "framer-motion";
import { Search, AlertTriangle, FileX } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
          <Search size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
          No reports match your filters
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Try adjusting your search or filter criteria
        </p>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-colors"
        >
          Clear Filters
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Simple road illustration */}
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
        <FileX size={28} className="text-[var(--color-text-muted)]" />
      </div>

      <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
        No reports found
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] text-center mb-5 max-w-[240px]">
        You haven&apos;t submitted any road hazard reports yet. Help keep roads safe!
      </p>
      <a
        href="/dashboard/report"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-amber)] text-white text-xs font-medium hover:bg-[var(--color-amber)]/90 transition-colors shadow-[var(--shadow-fab)]"
      >
        <AlertTriangle size={14} />
        Report Your First Hazard
      </a>
    </motion.div>
  );
}
