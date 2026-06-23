"use client";

import { useRef, useState, useCallback } from "react";
import { ActionColumn, UpvoteBurst } from "./ActionColumn";
import { CardOverlay } from "./CardOverlay";
import type { ReportFeedItem } from "./types";

interface ReportCardProps {
  report: ReportFeedItem;
  onUpvote: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollow: () => void;
  onDelete?: () => void;
}

export function ReportCard({ report, onUpvote, onComment, onShare, onSave, onFollow, onDelete }: ReportCardProps) {
  const [doubleTap, setDoubleTap] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap - upvote
        const rect = cardRef.current?.getBoundingClientRect();
        let clientX: number, clientY: number;
        if ("touches" in e) {
          clientX = e.changedTouches?.[0]?.clientX ?? 0;
          clientY = e.changedTouches?.[0]?.clientY ?? 0;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        const x = clientX - (rect?.left ?? 0);
        const y = clientY - (rect?.top ?? 0);
        setDoubleTap({ show: true, x, y });
        onUpvote();
        setTimeout(() => setDoubleTap({ show: false, x: 0, y: 0 }), 800);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [onUpvote]
  );

  return (
    <div
      ref={cardRef}
      className="relative w-full flex-shrink-0 overflow-hidden"
      style={{ height: "100%", scrollSnapAlign: "start", scrollSnapStop: "always" }}
      onClick={handleTap}
    >
      {/* Media background */}
      <div className="absolute inset-0">
        {report.mediaType === "image" ? (
          <img
            src={report.mediaUrl}
            alt={report.title}
            className="w-full h-full object-cover"
          />
        ) : report.mediaType === "video" ? (
          <video
            src={report.mediaUrl}
            poster={report.thumbnailUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback: no media */
          <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">
            <div className="text-center">
              <span className="text-5xl block mb-2">{report.hazardEmoji}</span>
              <p className="text-sm text-[var(--color-text-muted)]">{report.location}</p>
            </div>
          </div>
        )}
      </div>

      {/* Gradient overlay (bottom) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Double tap burst */}
      <UpvoteBurst show={doubleTap.show} x={doubleTap.x} y={doubleTap.y} />

      {/* Action column (right side) */}
      <ActionColumn
        report={report}
        onUpvote={onUpvote}
        onComment={onComment}
        onShare={onShare}
        onSave={onSave}
        onDelete={onDelete}
      />

      {/* Card overlay (bottom left) */}
      <CardOverlay report={report} onFollow={onFollow} />
    </div>
  );
}
