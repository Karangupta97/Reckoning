"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { CommentItemRow } from "./CommentItem";
import { EmojiReactionBar } from "./EmojiReactionBar";
import { CommentInput } from "./CommentInput";
import type { ReportFeedItem, CommentItem } from "./types";

interface CommentsBottomSheetProps {
  report: ReportFeedItem;
  initialComments?: CommentItem[];
  onClose: () => void;
}

export function CommentsBottomSheet({ report, initialComments = [], onClose }: CommentsBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments, report.id]);

  // Detect virtual keyboard via visualViewport resize
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const threshold = window.innerHeight * 0.75;
      setKeyboardOpen(vv.height < threshold);
    };

    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

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

  // Sort: pinned first
  const sortedComments = [
    ...comments.filter((c) => c.isPinned),
    ...comments.filter((c) => !c.isPinned),
  ];

  return (
    <>
      {/* Backdrop — fixed overlay, never affects feed scroll or layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        style={{ touchAction: "none" }}
        onClick={onClose}
      />

      {/* Sheet — fixed position, isolated from feed flow */}
      <motion.div
        ref={sheetRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%", transition: { duration: 0.18, ease: "easeIn" } }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
        }}
        className="fixed left-0 right-0 z-50 flex flex-col bg-[var(--color-card)] rounded-t-[20px]"
        style={{
          bottom: keyboardOpen
            ? "0px"
            : "calc(var(--bottom-nav-height, 60px) + env(safe-area-inset-bottom, 0px))",
          height: keyboardOpen ? "85dvh" : "calc(85dvh - var(--bottom-nav-height, 60px))",
          maxHeight: keyboardOpen ? "85dvh" : "calc(85dvh - var(--bottom-nav-height, 60px))",
          willChange: "transform",
          contain: "layout style",
        }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-2 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center pb-3 border-b border-[var(--color-border)] shrink-0">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-sans)" }}>
            Comments
            <span className="ml-1.5 text-[var(--color-text-muted)] font-normal text-sm">({report.comments})</span>
          </h3>
        </div>

        {/* Comments scroll area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {sortedComments.length > 0 ? (
            sortedComments.map((comment) => (
              <CommentItemRow key={comment.id} comment={comment} />
            ))
          ) : (
            <div className="py-12 text-center">
              <MessageCircle size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
              <p className="text-xs text-[var(--color-text-muted)]">No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>

        {/* Sticky bottom section — emoji + input, always visible above navbar */}
        <div className="shrink-0 mt-auto">
          {/* Emoji row */}
          <EmojiReactionBar onReact={handleEmojiReact} />

          {/* Comment input */}
          <CommentInput onSubmit={handleAddComment} />
        </div>
      </motion.div>
    </>
  );
}
