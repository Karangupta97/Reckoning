"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  X,
  Copy,
  Check,
  MapPin,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  Users,
  Send,
  CheckCheck,
  ClipboardList,
  Wrench,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Share2,
  Bell,
  BellRing,
  CircleDot,
  Droplets,
  AlertTriangle,
  TrafficCone,
  TreePine,
  Award,
  Sparkles,
} from "lucide-react";
import type { MyReport } from "./types";
import { ReportTimeline } from "./ReportTimeline";
import { OfficialResponseCard } from "./OfficialResponseCard";
import { EvidenceGallery } from "./EvidenceGallery";
import { CitizenImpactCard } from "./CitizenImpactCard";

/* ─── Lazy Leaflet Map ────────────────────────────────────────── */
const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

/* ─── Hazard Icons ────────────────────────────────────────────── */
const HAZARD_ICONS: Record<string, ReactNode> = {
  pothole: <CircleDot size={12} />,
  flooding: <Droplets size={12} />,
  accident: <AlertTriangle size={12} />,
  signal: <TrafficCone size={12} />,
  debris: <TreePine size={12} />,
};

/* ─── Status Styles ───────────────────────────────────────────── */
const STATUS_BANNER: Record<string, { bg: string; icon: ReactNode; color: string }> = {
  submitted: { bg: "var(--color-surface)", icon: <Send size={18} />, color: "var(--color-text-muted)" },
  verified: { bg: "color-mix(in srgb, var(--color-info) 8%, var(--color-card))", icon: <CheckCheck size={18} />, color: "var(--color-info)" },
  assigned: { bg: "color-mix(in srgb, var(--color-amber) 8%, var(--color-card))", icon: <ClipboardList size={18} />, color: "var(--color-amber)" },
  in_progress: { bg: "color-mix(in srgb, var(--color-info) 8%, var(--color-card))", icon: <Wrench size={18} />, color: "var(--color-info)" },
  resolved: { bg: "color-mix(in srgb, var(--color-success) 8%, var(--color-card))", icon: <CheckCircle2 size={18} />, color: "var(--color-success)" },
  rejected: { bg: "color-mix(in srgb, var(--color-danger) 8%, var(--color-card))", icon: <XCircle size={18} />, color: "var(--color-danger)" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--color-danger)",
  high: "#F97316",
  medium: "var(--color-amber)",
  low: "var(--color-success)",
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) + " at " + date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/* ─── Props ───────────────────────────────────────────────────── */
interface ReportDetailPanelProps {
  report: MyReport;
  onClose: () => void;
  onDelete?: (report: MyReport) => void;
  onToggleNotify?: (report: MyReport) => void;
}

/* ─── Component ───────────────────────────────────────────────── */
export function ReportDetailPanel({ report, onClose, onDelete, onToggleNotify }: ReportDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [impactCardOpen, setImpactCardOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const banner = STATUS_BANNER[report.status] || STATUS_BANNER.submitted;

  const copyId = () => {
    navigator.clipboard.writeText(report.reportId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    const shareData = {
      title: report.title,
      text: `Road hazard report: ${report.title} at ${report.location.name}`,
      url: `${window.location.origin}/report/${report.id}`,
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url || "");
    }
  };

  // Generate mock photos
  const photos = report.hasPhoto && report.photoUrl
    ? Array.from({ length: report.photoCount }, (_, i) => `${report.photoUrl}&w=${800 + i * 50}`)
    : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Photo */}
        {photos.length > 0 && (
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={photos[activePhotoIndex]}
              alt={report.title}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setLightboxImage(photos[activePhotoIndex])}
            />
            {/* Photo dots */}
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activePhotoIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
            {/* Photo nav */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white text-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white text-sm"
                >
                  <ChevronLeft size={16} className="rotate-180" />
                </button>
              </>
            )}
          </div>
        )}

        <div className="p-4 space-y-5">
          {/* Report Identity */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.7rem] font-mono text-[var(--color-text-muted)]">
                {report.reportId}
              </span>
              <button
                onClick={copyId}
                className="flex items-center gap-1 text-[0.65rem] text-[var(--color-info)] hover:underline"
              >
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy ID</>}
              </button>
            </div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-2 leading-tight">
              {report.title}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                {HAZARD_ICONS[report.hazardType]} {report.hazardType.charAt(0).toUpperCase() + report.hazardType.slice(1)}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-medium capitalize"
                style={{
                  backgroundColor: `color-mix(in srgb, ${SEVERITY_COLORS[report.severity]} 12%, transparent)`,
                  color: SEVERITY_COLORS[report.severity],
                }}
              >
                {report.severity}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                <MapPin size={10} /> {report.location.road}
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
              <p className="flex items-center gap-1.5">
                <MapPin size={12} className="text-[var(--color-text-muted)]" />
                {report.location.name}, {report.location.state}
              </p>
              <p className="flex items-center gap-1.5">
                <Clock size={12} className="text-[var(--color-text-muted)]" />
                Submitted: {formatDate(report.createdAt)}
              </p>
              <p className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Eye size={12} className="text-[var(--color-text-muted)]" /> {formatViews(report.views)} views</span>
                <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-[var(--color-text-muted)]" /> {report.upvotes} upvotes</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} className="text-[var(--color-text-muted)]" /> {report.comments} comments</span>
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: banner.bg,
              borderColor: `color-mix(in srgb, ${banner.color} 20%, transparent)`,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: banner.color }}>{banner.icon}</span>
              <span className="text-sm font-bold uppercase" style={{ color: banner.color }}>
                {report.status.replace("_", " ")}
              </span>
            </div>
            {report.status === "rejected" && report.rejectionReason && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                {report.rejectionReason}
              </p>
            )}
            {report.assignedTo && report.status !== "rejected" && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Assigned to: {report.assignedTo}
              </p>
            )}
            {report.expectedResolution && report.status !== "resolved" && report.status !== "rejected" && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Expected resolution: {new Date(report.expectedResolution).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">Description</p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* AI Analysis */}
          {report.aiDetected && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--color-amber)] animate-pulse" /> AI Analysis
              </p>
              <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {report.aiCategory && (
                  <p>
                    <span className="font-semibold text-[var(--color-text-primary)]">Suggested Category:</span>{" "}
                    {report.aiCategory.charAt(0).toUpperCase() + report.aiCategory.slice(1).toLowerCase().replace("_", " ")}
                  </p>
                )}
                {report.aiConfidence != null && (
                  <p>
                    <span className="font-semibold text-[var(--color-text-primary)]">Confidence:</span>{" "}
                    {Math.round(report.aiConfidence * 100)}%
                  </p>
                )}
              </div>
              {report.aiAnnotatedImage && (
                <div className="mt-4 space-y-4">
                  {/* Original Image */}
                  {report.photoUrl && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Original Upload</p>
                      <div 
                        className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] cursor-zoom-in relative group"
                        onClick={() => setLightboxImage(report.photoUrl!)}
                      >
                        <div className="relative aspect-video max-h-52 w-full flex justify-center bg-black/5">
                          <img
                            src={report.photoUrl}
                            alt="Original Upload"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Detection */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">AI Detection</p>
                    <div 
                      className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] cursor-zoom-in relative group"
                      onClick={() => setLightboxImage(report.aiAnnotatedImage!)}
                    >
                      <div className="relative aspect-video max-h-52 w-full flex justify-center bg-black/5">
                        <img
                          src={report.aiAnnotatedImage}
                          alt="AI Annotated Detection"
                          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Official Response */}
          {report.officialResponse && (
            <OfficialResponseCard response={report.officialResponse} />
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">Status Timeline</p>
            <ReportTimeline timeline={report.timeline} />
          </div>

          {/* Evidence Gallery */}
          <EvidenceGallery report={report} />

          {/* Location Map */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">Location</p>
            <div className="rounded-xl overflow-hidden h-[180px] border border-[var(--color-border)]">
              <LocationMap lat={report.location.lat} lng={report.location.lng} />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2 flex items-center gap-1.5">
              <MapPin size={11} className="text-[var(--color-text-muted)]" />
              {report.location.road}, {report.location.name}
            </p>
            <p className="text-[0.65rem] font-mono text-[var(--color-text-muted)] mt-0.5">
              {report.location.gps}
            </p>
          </div>

          {/* Community Engagement */}
          <div className="rounded-xl bg-[var(--color-surface)] p-4">
            <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-3">Community Response</p>
            <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <p className="flex items-center gap-1.5">
                <ThumbsUp size={12} className="text-[var(--color-text-muted)]" />
                {report.upvotes} people upvoted this report
              </p>
              {report.communityVerified && (
                <p className="flex items-center gap-1.5">
                  <Users size={12} className="text-[var(--color-text-muted)]" />
                  {report.verificationCount} citizens verified this
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <MessageCircle size={12} className="text-[var(--color-text-muted)]" />
                {report.comments} comments
              </p>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] transition-colors flex items-center justify-center gap-1.5">
                <MessageCircle size={12} /> View Comments
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 size={12} /> Share Report
              </button>
            </div>
          </div>

          {/* Impact Card — visible when report is resolved */}
          {report.status === "resolved" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={() => setImpactCardOpen(true)}
                className="w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                style={{
                  borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)",
                  background: "color-mix(in srgb, var(--color-info) 8%, var(--color-card))",
                  color: "var(--color-info)",
                }}
              >
                <Award size={14} /> Generate Shareable Impact Card
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Buttons (sticky bottom) */}
      <div className="border-t border-[var(--color-border)] p-4 flex gap-2 bg-[var(--color-card)]" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        {report.status === "submitted" && (
          <button className="flex-1 py-2.5 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] transition-colors flex items-center justify-center gap-1.5">
            <Pencil size={12} /> Edit
          </button>
        )}
        {report.status === "submitted" && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 py-2.5 rounded-full border border-[var(--color-danger)]/30 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 size={12} /> Delete
          </button>
        )}
        <button
          onClick={handleShare}
          className="flex-1 py-2.5 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-amber)] transition-colors flex items-center justify-center gap-1.5"
        >
          <Share2 size={12} /> Share
        </button>
        <button
          onClick={() => onToggleNotify?.(report)}
          className={`flex-1 py-2.5 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            report.isNotifying
              ? "bg-[var(--color-amber)] text-white"
              : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-amber)]"
          }`}
        >
          {report.isNotifying ? <BellRing size={12} /> : <Bell size={12} />}
          {report.isNotifying ? "Notifying" : "Notify me"}
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--color-card)] rounded-2xl p-5 max-w-[280px] w-full shadow-[var(--shadow-neu-lg)]"
          >
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Delete this report?
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              This action cannot be undone. The report will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)]"
              >
                Cancel
              </button>
              <motion.button
                onClick={() => { setShowDeleteConfirm(false); onDelete?.(report); }}
                className="flex-1 py-2.5 rounded-full bg-[var(--color-danger)] text-white text-xs font-medium"
                whileTap={{ x: [0, -3, 3, -2, 2, 0] }}
                transition={{ duration: 0.3 }}
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Impact Card Modal */}
      <AnimatePresence>
        {impactCardOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setImpactCardOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-5"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <CitizenImpactCard report={report} onClose={() => setImpactCardOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => setLightboxImage(null)}
              aria-label="Close image lightbox"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={lightboxImage}
              alt="Full screen view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
