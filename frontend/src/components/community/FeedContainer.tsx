"use client";

import { useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { ReportCard } from "./ReportCard";
import type { ReportFeedItem } from "./types";

interface FeedContainerProps {
  reports: ReportFeedItem[];
  onUpvote: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onSave: (id: string) => void;
  onFollow: (id: string) => void;
  onIndexChange?: (index: number) => void;
}

export interface FeedContainerRef {
  scrollToIndex: (index: number) => void;
  currentIndex: number;
  totalCount: number;
}

export const FeedContainer = forwardRef<FeedContainerRef, FeedContainerProps>(
  function FeedContainer({ reports, onUpvote, onComment, onShare, onSave, onFollow, onIndexChange }, ref) {
    const feedRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const prevIndexRef = useRef(0);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const nextIndex = e.key === "ArrowDown"
            ? Math.min(currentIndex + 1, reports.length - 1)
            : Math.max(currentIndex - 1, 0);
          scrollToIndex(nextIndex);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, reports.length]);

    // Track current card via IntersectionObserver
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
              if (idx !== -1) setCurrentIndex(idx);
            }
          });
        },
        { threshold: 0.6, root: feedRef.current }
      );

      cardRefs.current.forEach((r) => {
        if (r) observer.observe(r);
      });

      return () => observer.disconnect();
    }, [reports.length]);

    // Notify parent when active index changes
    useEffect(() => {
      if (currentIndex !== prevIndexRef.current) {
        prevIndexRef.current = currentIndex;
        onIndexChange?.(currentIndex);
      }
    }, [currentIndex, onIndexChange]);

    const scrollToIndex = useCallback((index: number) => {
      cardRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
      setCurrentIndex(index);
    }, []);

    const setCardRef = useCallback((el: HTMLDivElement | null, index: number) => {
      cardRefs.current[index] = el;
    }, []);

    // Expose navigation to parent
    useImperativeHandle(ref, () => ({
      scrollToIndex,
      currentIndex,
      totalCount: reports.length,
    }), [scrollToIndex, currentIndex, reports.length]);

    return (
      <div className="h-full w-full overflow-hidden overflow-x-hidden">
        <div
          ref={feedRef}
          className="h-full w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
          }}
        >
          {reports.map((report, i) => (
            <div
              key={report.id}
              ref={(el) => setCardRef(el, i)}
              className="snap-start snap-always h-full w-full shrink-0 py-2 lg:py-3"
            >
              <div className="h-full w-full rounded-2xl overflow-hidden">
                <ReportCard
                  report={report}
                  onUpvote={() => onUpvote(report.id)}
                  onComment={() => onComment(report.id)}
                  onShare={() => onShare(report.id)}
                  onSave={() => onSave(report.id)}
                  onFollow={() => onFollow(report.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
