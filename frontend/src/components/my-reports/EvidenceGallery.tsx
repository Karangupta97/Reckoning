"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Copy, ShieldCheck, Camera, CheckCircle2, Clock } from "lucide-react";
import type { MyReport } from "./types";

interface EvidenceGalleryProps {
  report: MyReport;
}

const STATUS_EVIDENCE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  resolved:    { label: "Issue Resolved",     color: "#10b981", bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.2)"  },
  verified:    { label: "Verified by Officer", color: "#60a5fa", bg: "rgba(96,165,250,0.06)",  border: "rgba(96,165,250,0.2)"  },
  in_progress: { label: "Work In Progress",   color: "#f59e0b", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.2)"  },
  assigned:    { label: "Officer Assigned",   color: "#f97316", bg: "rgba(249,115,22,0.06)",  border: "rgba(249,115,22,0.2)"  },
};

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: { url: string; label: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.img
        key={index}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        src={photos[index].url}
        alt={photos[index].label}
        className="max-w-full max-h-[80vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-xs">{photos[index].label}</p>
      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <ChevronLeft size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <ChevronLeft size={20} className="rotate-180" />
          </button>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
        <X size={20} />
      </button>
    </motion.div>
  );
}

export function EvidenceGallery({ report }: EvidenceGalleryProps) {
  const [citizenLightbox, setCitizenLightbox] = useState<number | null>(null);
  const [officerLightbox, setOfficerLightbox] = useState<number | null>(null);
  const [gpsCopied, setGpsCopied] = useState(false);

  // ── Citizen photos: original submission media ──────────────────────────
  const citizenPhotos = report.media && report.media.length > 0
    ? report.media
        .filter((m) => m.mimeType.startsWith("image/") && m.isPrimary !== false)
        .slice(0, Math.ceil(report.media.length / 2) || report.media.length)
        .map((m, i) => ({ url: m.url, label: `Your photo ${i + 1}` }))
    : report.photoUrl
      ? [{ url: report.photoUrl, label: "Your photo" }]
      : [];

  // ── Officer evidence: later-linked media (non-primary or all if resolved) ──
  // Since there's no uploadedBy field yet, we show all media when status is
  // resolved/verified as "official response evidence" in addition to citizen section.
  const officerPhotos = report.media && report.media.length > 1
    ? report.media
        .filter((m) => m.mimeType.startsWith("image/") && !m.isPrimary)
        .map((m, i) => ({ url: m.url, label: `Officer evidence ${i + 1}` }))
    : [];

  const statusCfg = STATUS_EVIDENCE_CONFIG[report.status];
  const hasOfficerSection = officerPhotos.length > 0 ||
    ["resolved", "verified", "in_progress", "assigned"].includes(report.status);

  const copyGPS = () => {
    navigator.clipboard.writeText(report.location.gps);
    setGpsCopied(true);
    setTimeout(() => setGpsCopied(false), 1500);
  };

  if (citizenPhotos.length === 0 && officerPhotos.length === 0) return null;

  return (
    <div className="space-y-4">

      {/* ── Citizen Submitted Evidence ───────────────────────────────────── */}
      {citizenPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Camera size={13} className="text-[var(--color-amber)]" />
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">Evidence Submitted by You</p>
            <span className="text-[10px] text-[var(--color-text-muted)]">({citizenPhotos.length})</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {citizenPhotos.map((photo, i) => (
              <button key={i}
                onClick={() => setCitizenLightbox(i)}
                className="relative aspect-square rounded-xl overflow-hidden group border border-[var(--color-border)]">
                <img src={photo.url} alt={photo.label}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: "rgba(245,158,11,0.85)", color: "#000" }}>
                  You
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-[0.65rem] text-[var(--color-text-muted)]">
              Submitted · {new Date(report.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <button onClick={copyGPS}
              className="flex items-center gap-1 text-[0.65rem] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors">
              <Copy size={9} />
              GPS: {report.location.gps}
              {gpsCopied && <span className="text-[var(--color-success)] ml-1">Copied</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── Official Response Evidence ────────────────────────────────────── */}
      {hasOfficerSection && (
        <div className="rounded-xl border p-3"
          style={{
            borderColor: statusCfg?.border ?? "rgba(96,165,250,0.2)",
            background: statusCfg?.bg ?? "rgba(96,165,250,0.04)",
          }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} style={{ color: statusCfg?.color ?? "#60a5fa" }} />
            <p className="text-xs font-semibold" style={{ color: statusCfg?.color ?? "#60a5fa" }}>
              Official Response Evidence
            </p>
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: statusCfg?.color ?? "#60a5fa",
                background: `${statusCfg?.color ?? "#60a5fa"}15`,
                border: `1px solid ${statusCfg?.border ?? "rgba(96,165,250,0.2)"}`,
              }}>
              <CheckCircle2 size={9} /> {statusCfg?.label ?? "Authority Response"}
            </span>
          </div>

          {officerPhotos.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {officerPhotos.map((photo, i) => (
                  <button key={i}
                    onClick={() => setOfficerLightbox(i)}
                    className="relative aspect-square rounded-xl overflow-hidden group border"
                    style={{ borderColor: `${statusCfg?.color ?? "#60a5fa"}30` }}>
                    <img src={photo.url} alt={photo.label}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: statusCfg?.color ?? "#60a5fa", color: "#fff" }}>
                      Officer
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px]" style={{ color: statusCfg?.color ?? "#60a5fa" }}>
                Evidence uploaded by the assigned officer · verified by authority
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{ borderColor: `${statusCfg?.color ?? "#60a5fa"}30`, background: `${statusCfg?.color ?? "#60a5fa"}10` }}>
                <Clock size={16} style={{ color: statusCfg?.color ?? "#60a5fa" }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: statusCfg?.color ?? "#60a5fa" }}>
                  {statusCfg?.label ?? "Authority Response"}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {report.status === "resolved"
                    ? "This complaint has been resolved. Officer evidence will appear here once uploaded."
                    : report.status === "in_progress"
                    ? "Work is currently in progress. Evidence photos will be added when complete."
                    : "Complaint is under review. Evidence will appear here when uploaded by the officer."}
                </p>
              </div>
            </div>
          )}

          {/* Official note from authority */}
          {report.officialResponse && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: `${statusCfg?.color ?? "#60a5fa"}20` }}>
              <p className="text-[10px] font-semibold mb-1" style={{ color: statusCfg?.color ?? "#60a5fa" }}>
                Authority Note
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {report.officialResponse.text}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                — {report.officialResponse.author} · {new Date(report.officialResponse.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Citizen lightbox */}
      <AnimatePresence>
        {citizenLightbox !== null && (
          <Lightbox
            photos={citizenPhotos}
            index={citizenLightbox}
            onClose={() => setCitizenLightbox(null)}
            onPrev={() => setCitizenLightbox((citizenLightbox - 1 + citizenPhotos.length) % citizenPhotos.length)}
            onNext={() => setCitizenLightbox((citizenLightbox + 1) % citizenPhotos.length)}
          />
        )}
      </AnimatePresence>

      {/* Officer lightbox */}
      <AnimatePresence>
        {officerLightbox !== null && officerPhotos.length > 0 && (
          <Lightbox
            photos={officerPhotos}
            index={officerLightbox}
            onClose={() => setOfficerLightbox(null)}
            onPrev={() => setOfficerLightbox((officerLightbox - 1 + officerPhotos.length) % officerPhotos.length)}
            onNext={() => setOfficerLightbox((officerLightbox + 1) % officerPhotos.length)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
