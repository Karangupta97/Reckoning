"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";

interface ReportLightboxProps {
  /** All evidence image URLs. */
  images: string[];
  /** Optional AI-annotated image URL. */
  annotatedImageUrl?: string;
  /** Index of the initially active image. */
  initialIndex?: number;
  /** Whether the lightbox is open. */
  open: boolean;
  /** Called when the lightbox should close. */
  onClose: () => void;
}

/**
 * Full-screen dark overlay lightbox with arrow navigation between evidence
 * files. Supports toggling between original and AI-annotated image when
 * `annotatedImageUrl` is provided. Closes on Escape or click outside.
 */
export function ReportLightbox({
  images,
  annotatedImageUrl,
  initialIndex = 0,
  open,
  onClose,
}: ReportLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showAnnotated, setShowAnnotated] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setActiveIndex(initialIndex);
      setShowAnnotated(false);
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (i - 1 + images.length) % images.length);
        setShowAnnotated(false);
      }
      if (e.key === "ArrowRight") {
        setActiveIndex((i) => (i + 1) % images.length);
        setShowAnnotated(false);
      }
    },
    [open, images.length, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const currentSrc = showAnnotated && annotatedImageUrl
    ? annotatedImageUrl
    : images[activeIndex];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/92 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Main image */}
          <motion.img
            key={`${activeIndex}-${showAnnotated}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            src={currentSrc}
            alt={`Evidence ${activeIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Arrow: left */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + images.length) % images.length);
                  setShowAnnotated(false);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Arrow: right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % images.length);
                  setShowAnnotated(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <ChevronLeft size={20} className="rotate-180" />
              </button>
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            <X size={20} />
          </button>

          {/* Bottom bar: dots + annotated toggle */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveIndex(i); setShowAnnotated(false); }}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: i === activeIndex ? "white" : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Original / Annotated toggle */}
            {annotatedImageUrl && (
              <button
                onClick={() => setShowAnnotated((v) => !v)}
                className="px-3 py-1.5 rounded-full text-[0.7rem] font-semibold transition-colors"
                style={{
                  backgroundColor: showAnnotated
                    ? "var(--color-amber)"
                    : "rgba(255,255,255,0.15)",
                  color: showAnnotated ? "#1c2b3a" : "white",
                  backdropFilter: "blur(8px)",
                }}
              >
                {showAnnotated ? "✦ AI Annotated" : "Show AI View"}
              </button>
            )}
          </div>

          {/* Image counter */}
          <div
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[0.7rem] font-mono text-white/70"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          >
            {activeIndex + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
