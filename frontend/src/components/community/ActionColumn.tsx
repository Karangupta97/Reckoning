"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Bookmark, MoreHorizontal, ChevronUp } from "lucide-react";
import type { ReportFeedItem } from "./types";

interface ActionColumnProps {
  report: ReportFeedItem;
  onUpvote: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function ActionColumn({ report, onUpvote, onComment, onShare, onSave }: ActionColumnProps) {
  const [upvoteAnim, setUpvoteAnim] = useState(false);

  const handleUpvote = () => {
    setUpvoteAnim(true);
    onUpvote();
    setTimeout(() => setUpvoteAnim(false), 400);
  };

  return (
    <div className="absolute right-3 bottom-20 md:bottom-24 flex flex-col items-center gap-5 z-10">
      {/* Upvote */}
      <button onClick={handleUpvote} className="flex flex-col items-center gap-0.5">
        <motion.div
          animate={upvoteAnim ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronUp
            size={28}
            strokeWidth={2.5}
            className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
            style={{ color: report.hasUpvoted ? "var(--color-amber)" : "white" }}
            fill={report.hasUpvoted ? "var(--color-amber)" : "none"}
          />
        </motion.div>
        <span className="text-[0.8rem] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]" style={{ fontFamily: "var(--font-sans)" }}>
          {formatCount(report.upvotes)}
        </span>
      </button>

      {/* Comments */}
      <button onClick={onComment} className="flex flex-col items-center gap-0.5">
        <MessageCircle
          size={28}
          strokeWidth={1.8}
          className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
        />
        <span className="text-[0.8rem] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {formatCount(report.comments)}
        </span>
      </button>

      {/* Share */}
      <button onClick={onShare} className="flex flex-col items-center gap-0.5">
        <Send
          size={28}
          strokeWidth={1.8}
          className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] -rotate-12"
        />
        <span className="text-[0.8rem] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {formatCount(report.shares)}
        </span>
      </button>

      {/* Save */}
      <button onClick={onSave} className="flex flex-col items-center gap-0.5">
        <Bookmark
          size={28}
          strokeWidth={1.8}
          className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
          style={{ color: report.isSaved ? "var(--color-amber)" : "white" }}
          fill={report.isSaved ? "var(--color-amber)" : "none"}
        />
        <span className="text-[0.8rem] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {formatCount(report.saves)}
        </span>
      </button>

      {/* More */}
      <button className="flex flex-col items-center">
        <MoreHorizontal
          size={24}
          strokeWidth={2}
          className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
        />
      </button>

      {/* Thumbnail */}
      <div
        className="w-11 h-11 rounded-lg border-[1.5px] border-[var(--color-amber)] overflow-hidden"
      >
        <img
          src={report.thumbnailUrl}
          alt={report.hazardType}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

/* ─── Double Tap Upvote Burst ───────────────────────────────── */
export function UpvoteBurst({ show, x, y }: { show: boolean; x: number; y: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute z-50 pointer-events-none"
          style={{ left: x - 40, top: y - 40 }}
        >
          <ChevronUp size={80} className="text-[var(--color-amber)]" fill="var(--color-amber)" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
