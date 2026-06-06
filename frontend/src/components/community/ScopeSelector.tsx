"use client";

import { motion } from "framer-motion";
import { X, Search } from "lucide-react";
import { SCOPE_OPTIONS } from "./mockData";
import type { FeedScope } from "./types";

/* ─── Mobile Bottom Sheet ───────────────────────────────────── */
interface ScopeSelectorSheetProps {
  currentScope: FeedScope;
  onSelect: (scope: FeedScope) => void;
  onClose: () => void;
}

export function ScopeSelectorSheet({ currentScope, onSelect, onClose }: ScopeSelectorSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)] rounded-t-[20px]"
        style={{ height: "50dvh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Handle */}
        <div className="flex items-center justify-center pt-2 pb-1">
          <div className="w-9 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)]"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="text-center pb-3 border-b border-[var(--color-border)]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">Select Scope</h3>
        </div>

        {/* Options */}
        <div className="px-4 py-3 space-y-1">
          {SCOPE_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => { onSelect(option.key); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-colors hover:bg-[var(--color-surface)]"
              style={{
                borderLeft: currentScope === option.key ? "3px solid var(--color-amber)" : "3px solid transparent",
                backgroundColor: currentScope === option.key ? "color-mix(in srgb, var(--color-amber) 8%, transparent)" : undefined,
              }}
            >
              <span className="text-2xl w-8 text-center">{option.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{option.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{option.sublabel}</p>
              </div>
              <span className="text-[0.7rem] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2.5 py-1 rounded-full">
                {option.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <Search size={16} className="text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search any location..."
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Desktop Popover (Glassmorphism + Neumorphic) ─────────── */
interface ScopeSelectorPopoverProps {
  currentScope: FeedScope;
  onSelect: (scope: FeedScope) => void;
  onClose: () => void;
}

export function ScopeSelectorPopover({ currentScope, onSelect, onClose }: ScopeSelectorPopoverProps) {
  return (
    <>
      {/* Click away */}
      <div className="fixed inset-0 z-20" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute top-full right-0 mt-2 z-30 w-[300px] rounded-2xl p-2 border border-[var(--color-border)] backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--color-card) 85%, transparent)",
          boxShadow: "var(--shadow-neu-lg)",
        }}
      >
        {/* Options */}
        {SCOPE_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => { onSelect(option.key); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors hover:bg-[var(--color-surface)]"
            style={{
              borderLeft: currentScope === option.key ? "3px solid var(--color-amber)" : "3px solid transparent",
              backgroundColor: currentScope === option.key ? "color-mix(in srgb, var(--color-amber) 8%, transparent)" : undefined,
            }}
          >
            <span className="text-xl w-7 text-center">{option.icon}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{option.label}</p>
              <p className="text-[0.7rem] text-[var(--color-text-muted)]">{option.sublabel}</p>
            </div>
            <span className="text-[0.65rem] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded-full">
              {option.count}
            </span>
          </button>
        ))}

        {/* Search */}
        <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface)]">
            <Search size={14} className="text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search any location..."
              className="flex-1 bg-transparent text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
