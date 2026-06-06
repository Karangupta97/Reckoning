"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import type { CommentItem as CommentItemType, CommentReply } from "./types";

interface CommentItemProps {
  comment: CommentItemType;
}

export function CommentItemRow({ comment }: CommentItemProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [showReplies, setShowReplies] = useState(comment.isPinned);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div>
      {/* Pinned / Official badge */}
      {comment.isPinned && (
        <div className="flex items-center gap-1 mb-1.5 text-[0.7rem]">
          <span className="text-[var(--color-amber)]">📌 Pinned</span>
        </div>
      )}

      <div
        className="flex items-start gap-2.5 p-2 rounded-lg"
        style={{
          borderLeft: comment.isOfficial ? "3px solid var(--color-info)" : comment.isPinned ? "3px solid var(--color-amber)" : "none",
          backgroundColor: comment.isOfficial ? "rgba(59,130,246,0.06)" : "transparent",
        }}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[0.7rem] font-bold text-white shrink-0"
          style={{ backgroundColor: comment.color }}
        >
          {comment.initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[0.85rem] font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-sans)" }}>
                {comment.userName}
              </span>
              {comment.isOfficial && (
                <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-medium bg-[var(--color-info)]/10 text-[var(--color-info)]">
                  Official
                </span>
              )}
              <span className="text-[0.75rem] text-[var(--color-text-muted)]">{comment.timeAgo}</span>
            </div>

            {/* Like button */}
            <button onClick={handleLike} className="flex items-center gap-0.5 shrink-0">
              <Heart
                size={14}
                className="transition-colors"
                style={{ color: liked ? "var(--color-danger)" : "var(--color-text-muted)" }}
                fill={liked ? "var(--color-danger)" : "none"}
              />
              <span className="text-[0.7rem] text-[var(--color-text-muted)]">{likeCount}</span>
            </button>
          </div>

          <p className="text-[0.875rem] text-[var(--color-text-primary)] leading-relaxed mt-0.5">
            {comment.text}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1.5">
            <button className="text-[0.75rem] text-[var(--color-text-muted)] font-medium hover:text-[var(--color-text-secondary)] transition-colors">
              Reply
            </button>
            <button className="text-[0.75rem] text-[var(--color-text-muted)] font-medium hover:text-[var(--color-text-secondary)] transition-colors">
              See translation
            </button>
            {comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-[0.75rem] text-[var(--color-text-muted)] font-medium hover:text-[var(--color-text-secondary)] transition-colors"
              >
                {showReplies ? "Hide" : "View"} {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      <AnimatePresence>
        {showReplies && comment.replies.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-11 mt-1 space-y-2"
          >
            {comment.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReplyItem({ reply }: { reply: CommentReply }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reply.likes);

  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[0.6rem] font-bold text-[var(--color-text-muted)] shrink-0">
        {reply.userName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[0.8rem] font-semibold text-[var(--color-text-primary)]">{reply.userName}</span>
            <span className="text-[0.7rem] text-[var(--color-text-muted)]">{reply.timeAgo}</span>
          </div>
          <button onClick={() => { setLiked(!liked); setLikeCount((c) => liked ? c - 1 : c + 1); }} className="flex items-center gap-0.5 shrink-0">
            <Heart size={12} style={{ color: liked ? "var(--color-danger)" : "var(--color-text-muted)" }} fill={liked ? "var(--color-danger)" : "none"} />
            <span className="text-[0.65rem] text-[var(--color-text-muted)]">{likeCount}</span>
          </button>
        </div>
        <p className="text-[0.8rem] text-[var(--color-text-primary)] leading-relaxed mt-0.5">{reply.text}</p>
      </div>
    </div>
  );
}
