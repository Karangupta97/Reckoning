"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Copy } from "lucide-react";
import type { MyReport } from "./types";

interface EvidenceGalleryProps {
  report: MyReport;
}

export function EvidenceGallery({ report }: EvidenceGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gpsCopied, setGpsCopied] = useState(false);

  if (!report.hasPhoto || !report.photoUrl) return null;

  // Generate mock multiple photos from same URL with different crops
  const photos = Array.from({ length: report.photoCount }, (_, i) => ({
    url: `${report.photoUrl}&w=${800 + i * 50}`,
    label: `Photo ${i + 1}`,
  }));

  const copyGPS = () => {
    navigator.clipboard.writeText(report.location.gps);
    setGpsCopied(true);
    setTimeout(() => setGpsCopied(false), 1500);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">
        Evidence Submitted
      </p>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => { setActiveIndex(i); setLightboxOpen(true); }}
            className="relative aspect-square rounded-xl overflow-hidden group"
          >
            <img
              src={photo.url}
              alt={`Evidence ${i + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      <p className="text-[0.65rem] text-[var(--color-text-muted)] mt-2">
        Submitted with report · {new Date(report.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
      </p>
      <button
        onClick={copyGPS}
        className="flex items-center gap-1 text-[0.65rem] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors mt-0.5"
        title="Copy GPS coordinates"
      >
        <Copy size={10} />
        GPS: {report.location.gps}
        {gpsCopied && <span className="text-[var(--color-success)] ml-1">Copied</span>}
      </button>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.img
              key={activeIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={photos[activeIndex].url}
              alt={`Evidence ${activeIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Nav arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((activeIndex - 1 + photos.length) % photos.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((activeIndex + 1) % photos.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <ChevronLeft size={20} className="rotate-180" />
                </button>
              </>
            )}
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <X size={20} />
            </button>
            {/* Dots */}
            {photos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activeIndex ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
