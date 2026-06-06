"use client";

import { useState, useEffect, useCallback, type RefObject } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { CommentItemRow } from "./CommentItem";
import { EmojiReactionBar } from "./EmojiReactionBar";
import { CommentInput } from "./CommentInput";
import { MOCK_COMMENTS, SEVERITY_COLORS, SEVERITY_LABELS } from "./mockData";
import type { ReportFeedItem, CommentItem } from "./types";

interface CommentsPanelProps {
  report: ReportFeedItem;
  reelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

/**
 * Fixed-position comments panel that anchors itself relative to the reel
 * container without participating in the feed's flex/grid layout.
 * Opening/closing this component has ZERO effect on reel position.
 */
export function CommentsPanel({ report, reelRef, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentItem[]>(
    MOCK_COMMENTS[report.id] || []
  );
  const [position, setPosition] = useState<{ top: number; left: number; height: number } | null>(null);
  const panelWidth = 380;
  const gap = 24;

  // Calculate position relative to the reel element
  const calcPosition = useCallback(() => {
    if (!reelRef.current) return;
    const rect = reelRef.current.getBoundingClientRect();
    const vw = window.innerWidth;

    // Space available on the right of the reel
    const spaceRight = vw - rect.right;
    // Space available on the left of the reel
    const spaceLeft = rect.left;

    let left: number;
    if (spaceRight >= panelWidth + gap) {
      // Place on the right
      left = rect.right + gap;
    } else if (spaceLeft >= panelWidth + gap) {
      // Place on the left
      left = rect.left - panelWidth - gap;
    } else {
      // Fallback: overlap slightly on the right
      left = vw - panelWidth - 16;
    }

    // Vertically center against the reel
    const reelCenterY = rect.top + rect.height / 2;
    const panelHeight = Math.min(rect.height * 0.9, 720);
    const top = Math.max(16, reelCenterY - panelHeight / 2);

    setPosition({ top, left, height: panelHeight });
  }, [reelRef]);

  // Calculate on mount and on resize
  useEffect(() => {
    calcPosition();
    window.addEventListener("resize", calcPosition);
    return () => window.removeEventListener("resize", calcPosition);
  }, [calcPosition]);

  const handleAddComment = (text: string) => {
    const newComment: CommentItem = {
      id: `new-${Date.now()}`,
      userName: "You",
      initial: "Y",
      color: "#F59E0B",
      text,
      likes: 0,
      timeAgo: "now",
      isOfficial: false,
      isPinned: false,
      replies: [],
    };
    setComments((prev) => [newComment, ...prev]);
  };

  const handleEmojiReact = (emoji: string) => {
    handleAddComment(emoji);
  };

  const sortedComments = [
    ...comments.filter((c) => c.isPinned),
    ...comments.filter((c) => !c.isPinned),
  ];

  // Don't render until position is calculated
  if (!position) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 32,
        opacity: { duration: 0.15 },
      }}
      className="fixed z-50 flex flex-col"
      style={{
        top: position.top,
        left: position.left,
        width: panelWidth,
        height: position.height,
        borderRadius: "1.5rem",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        willChange: "transform, opacity",
        contain: "layout style paint",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] shrink-0 rounded-t-[1.5rem]">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-sans)" }}>
          Comments
          <span className="ml-1.5 text-[var(--color-text-muted)] font-normal text-xs">({report.comments})</span>
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-secondary)] transition-colors"
          aria-label="Close comments"
        >
          <X size={18} />
        </button>
      </div>

      {/* Mini report preview */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)] shrink-0">
        <div
          className="w-[48px] h-[48px] rounded-xl shrink-0 overflow-hidden"
        >
          <img
            src={report.thumbnailUrl}
            alt={report.hazardType}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.8rem] font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug">
            {report.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-medium"
              style={{ backgroundColor: `${SEVERITY_COLORS[report.severity]}15`, color: SEVERITY_COLORS[report.severity] }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[report.severity] }} />
              {SEVERITY_LABELS[report.severity]}
            </span>
            <span className="text-[0.6rem] text-[var(--color-text-muted)]">{report.location}</span>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div
        className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {sortedComments.length > 0 ? (
          sortedComments.map((comment) => (
            <CommentItemRow key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">No comments yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Emoji reaction bar */}
      <div className="shrink-0">
        <EmojiReactionBar onReact={handleEmojiReact} />
      </div>

      {/* Comment input */}
      <div className="shrink-0 rounded-b-[1.5rem]">
        <CommentInput onSubmit={handleAddComment} />
      </div>
    </motion.div>
  );
}
