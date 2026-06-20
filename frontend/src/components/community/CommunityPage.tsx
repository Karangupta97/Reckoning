"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { getCommunityFeed, getReportComments } from "@/lib/api/citizenApi";

import { FeedContainer } from "./FeedContainer";
import type { FeedContainerRef } from "./FeedContainer";
import { CommentsBottomSheet } from "./CommentsBottomSheet";
import { CommentsPanel } from "./CommentsPanel";
import type { ReportFeedItem, CommentItem } from "./types";

export function CommunityPage() {
  const email = useAuthStore((state) => state.user?.email);

  // State
  const [reports, setReports] = useState<ReportFeedItem[]>([]);
  const [commentReportId, setCommentReportId] = useState<string | null>(null);
  const [commentsByReport, setCommentsByReport] = useState<Record<string, CommentItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedRef = useRef<FeedContainerRef>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCommunityFeed("district", email);
        setReports(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load community feed.");
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadFeed();
  }, [email]);

  const activeCommentReport = commentReportId
    ? reports.find((r) => r.id === commentReportId) || null
    : null;

  // Auto-close comments when active post changes
  const handleIndexChange = useCallback((index: number) => {
    setCommentReportId(null);
  }, []);

  // Handlers
  const handleUpvote = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, hasUpvoted: !r.hasUpvoted, upvotes: r.hasUpvoted ? r.upvotes - 1 : r.upvotes + 1 }
          : r
      )
    );
  }, []);

  const handleSave = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSaved: !r.isSaved } : r))
    );
  }, []);

  const handleFollow = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFollowing: !r.isFollowing } : r))
    );
  }, []);

  const handleComment = useCallback(async (id: string) => {
    setCommentReportId(id);
    if (commentsByReport[id]) return;

    try {
      const comments = await getReportComments(id, email);
      setCommentsByReport((prev) => ({ ...prev, [id]: comments }));
    } catch {
      setCommentsByReport((prev) => ({ ...prev, [id]: [] }));
    }
  }, [commentsByReport, email]);

  const handleShare = useCallback((id: string) => {
    const text = `Road hazard reported: ${id} — View on Reckoning`;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/my-reports`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: `Complaint ${id}`, text, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        // Toast handled by parent if available
      });
    }
  }, []);

  const handleNavPrev = useCallback(() => {
    const idx = Math.max((feedRef.current?.currentIndex ?? 0) - 1, 0);
    feedRef.current?.scrollToIndex(idx);
  }, []);

  const handleNavNext = useCallback(() => {
    const max = (feedRef.current?.totalCount ?? 1) - 1;
    const idx = Math.min((feedRef.current?.currentIndex ?? 0) + 1, max);
    feedRef.current?.scrollToIndex(idx);
  }, []);

  return (
    <div className="relative h-full w-full overflow-x-hidden overflow-y-hidden bg-black lg:bg-[var(--color-page)]">
      {!isLoading && error && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {!isLoading && reports.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <p className="text-sm text-[var(--color-text-muted)]">No community reports available.</p>
        </div>
      )}

      {/* ─── Feed Container — NEVER changes when comments open ─── */}
      <div className="h-full w-full flex items-center justify-center">
        <div
          ref={reelRef}
          className="h-full w-full max-w-[380px] md:max-w-[420px] lg:max-w-[440px] xl:max-w-[480px] flex flex-col px-3 md:px-4 lg:px-0"
        >
          <div className="flex-1 min-h-0 overflow-hidden overflow-x-hidden">
            <FeedContainer
              ref={feedRef}
              reports={reports}
              onUpvote={handleUpvote}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              onFollow={handleFollow}
              onIndexChange={handleIndexChange}
            />
          </div>
        </div>
      </div>

      {/* ─── Navigation Arrows (fixed, independent layer) ─── */}
      <div className="hidden md:flex flex-col gap-3 fixed top-1/2 -translate-y-1/2 z-30 right-4 lg:right-8">
        <motion.button
          onClick={handleNavPrev}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-[var(--color-card)] flex items-center justify-center border border-[var(--color-border)] opacity-80 hover:opacity-100 transition-opacity"
          style={{ boxShadow: "var(--shadow-neu)" }}
          aria-label="Previous post"
        >
          <ChevronUp size={18} className="text-[var(--color-text-secondary)]" />
        </motion.button>
        <motion.button
          onClick={handleNavNext}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-[var(--color-card)] flex items-center justify-center border border-[var(--color-border)] opacity-80 hover:opacity-100 transition-opacity"
          style={{ boxShadow: "var(--shadow-neu)" }}
          aria-label="Next post"
        >
          <ChevronDown size={18} className="text-[var(--color-text-secondary)]" />
        </motion.button>
      </div>

      {/* ─── Desktop Comments: FIXED layer, completely outside feed layout ─── */}
      <AnimatePresence>
        {activeCommentReport && (
          <div className="hidden lg:block">
            <CommentsPanel
              report={activeCommentReport}
              initialComments={commentsByReport[activeCommentReport.id] ?? []}
              reelRef={reelRef}
              onClose={() => setCommentReportId(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ─── Mobile: Bottom Sheet (fixed layer, unchanged) ─── */}
      <AnimatePresence>
        {activeCommentReport && (
          <div className="lg:hidden">
            <CommentsBottomSheet
              report={activeCommentReport}
              initialComments={commentsByReport[activeCommentReport.id] ?? []}
              onClose={() => setCommentReportId(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
