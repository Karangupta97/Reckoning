"use client";

/**
 * LiveComplaintDetail — renders a full complaint detail view using real
 * backend API data (from useSubDistrictComplaintStore or direct fetch).
 *
 * Used when the complaint ID is a real CUID (not a mock CMP-XXXX ID).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Camera, FileText, Activity,
  Timer, CheckCircle2, AlertTriangle, Clock,
  X, ChevronLeft, ChevronRight, Download, ZoomIn,
  Loader2, ExternalLink, Sparkles, RefreshCw,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { AdminAIAnnotatedPanel } from "@/components/admin/AdminAIAnnotatedPanel";
import {
  useSubDistrictComplaintStore,
  type ApiComplaint,
  type ApiComplaintStatus,
} from "@/store/subDistrictComplaintStore";
import { adminAxios } from "@/lib/adminAxios";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<ApiComplaintStatus, { cls: string; label: string; color: string }> = {
  DRAFT:        { cls: "dashboard-table-badge-status-review",    label: "Draft",        color: "#94a3b8" },
  SUBMITTED:    { cls: "dashboard-table-badge-status-open",      label: "Submitted",    color: "#ef4444" },
  UNDER_REVIEW: { cls: "dashboard-table-badge-status-review",    label: "Under Review", color: "#a78bfa" },
  VERIFIED:     { cls: "dashboard-table-badge-status-review",    label: "Verified",     color: "#60a5fa" },
  ASSIGNED:     { cls: "dashboard-table-badge-status-escalated", label: "Assigned",     color: "#f97316" },
  IN_PROGRESS:  { cls: "dashboard-table-badge-status-review",    label: "In Progress",  color: "#f59e0b" },
  RESOLVED:     { cls: "dashboard-table-badge-status-resolved",  label: "Resolved",     color: "#10b981" },
  REJECTED:     { cls: "dashboard-table-badge-priority-high",    label: "Rejected",     color: "#ef4444" },
  ESCALATED:    { cls: "dashboard-table-badge-status-escalated", label: "Escalated",    color: "#f97316" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)" },
  HIGH:     { label: "High",     color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)" },
  MEDIUM:   { label: "Medium",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
  LOW:      { label: "Low",      color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)" },
};

const UPDATABLE_STATUSES: ApiComplaintStatus[] = [
  "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED", "ESCALATED",
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Breadcrumb({ id }: { id: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
      <Link href="/sub-district-admin/dashboard" className="hover:text-[var(--color-text-secondary)] transition-colors">Dashboard</Link>
      <span className="opacity-40">›</span>
      <Link href="/sub-district-admin/dashboard/complaints" className="hover:text-[var(--color-text-secondary)] transition-colors">Complaints</Link>
      <span className="opacity-40">›</span>
      <span className="text-[var(--color-text-secondary)] font-medium font-mono">{id.slice(0, 10)}…</span>
    </nav>
  );
}


/** Image lightbox for evidence gallery */
function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt={`Evidence ${index + 1}`}
          className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10"
        />
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-sm font-medium text-white">
            Evidence {index + 1} of {images.length}
          </p>
          <div className="flex items-center gap-2">
            <a href={images[index]} target="_blank" rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <Download size={14} />
            </a>
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
        {images.length > 1 && (
          <>
            <button onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Status update inline drawer */
function StatusUpdatePanel({
  complaint,
  onUpdate,
  isUpdating,
}: {
  complaint: ApiComplaint;
  onUpdate: (status: ApiComplaintStatus) => void;
  isUpdating: boolean;
}) {
  const [selected, setSelected] = useState<ApiComplaintStatus>(complaint.status);

  return (
    <DashboardCard className="p-4 flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Update Status
      </p>
      <div className="flex flex-col gap-1.5">
        {UPDATABLE_STATUSES.map((s) => {
          const style = STATUS_STYLE[s];
          const isActive = selected === s;
          const isCurrent = complaint.status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelected(s)}
              disabled={isCurrent}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium text-left transition-all disabled:opacity-40"
              style={{
                borderColor: isActive ? `${style.color}50` : "var(--color-border)",
                background:  isActive ? `${style.color}10` : "var(--color-surface)",
                color:       isActive ? style.color : "var(--color-text-secondary)",
              }}
            >
              <span>{style.label}</span>
              {isCurrent && <span className="text-[9px] opacity-60">current</span>}
              {isActive && !isCurrent && <CheckCircle2 size={12} />}
            </button>
          );
        })}
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => onUpdate(selected)}
        disabled={selected === complaint.status || isUpdating}
        className="flex items-center justify-center gap-2 h-9 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 w-full"
        style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 12%, transparent)", color: "var(--sda-amber)" }}
      >
        {isUpdating ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : "Update Status"}
      </motion.button>
    </DashboardCard>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface LiveComplaintDetailProps {
  complaintId: string;
}

export function LiveComplaintDetail({ complaintId }: LiveComplaintDetailProps) {
  const storeComplaint = useSubDistrictComplaintStore((s) =>
    s.complaints.find((c) => c.id === complaintId)
  );
  const updateComplaintStatus = useSubDistrictComplaintStore((s) => s.updateComplaintStatus);

  const [complaint, setComplaint] = useState<ApiComplaint | null>(storeComplaint ?? null);
  const [loading, setLoading] = useState(!storeComplaint);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Sync from store only when complaintId changes or data first becomes available
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (storeComplaint) {
      hasFetchedRef.current = true;
      setComplaint(storeComplaint);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await adminAxios.get<{
          success: boolean;
          data: ApiComplaint;
        }>(`/api/admin/subdistrict/complaints/${complaintId}`);

        if (mounted) {
          hasFetchedRef.current = true;
          setComplaint(res.data.data);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          if (err?.response?.status === 403) {
            setError("Complaint is out of your jurisdiction scope.");
          } else {
            setError(err instanceof Error ? err.message : "Failed to load complaint.");
          }
          setLoading(false);
        }
      }
    }
    void fetchDetail();
    return () => { mounted = false; };
  }, [complaintId, storeComplaint]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleStatusUpdate = useCallback(async (status: ApiComplaintStatus) => {
    if (!complaint) return;
    setIsUpdating(true);
    try {
      await updateComplaintStatus(complaint.id, status);
      setComplaint((prev) => prev ? { ...prev, status } : prev);
      showToast(`Status updated to ${STATUS_STYLE[status].label}`);
    } catch {
      showToast("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }, [complaint, updateComplaintStatus, showToast]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        <Breadcrumb id={complaintId} />
        <div className="flex items-center justify-center py-20 gap-2">
          <Loader2 size={18} className="animate-spin text-amber-400" />
          <span className="text-sm text-[var(--color-text-muted)]">Loading complaint details…</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !complaint) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        <Breadcrumb id={complaintId} />
        <DashboardCard className="p-6 flex flex-col items-center gap-3">
          <AlertTriangle size={24} className="text-amber-400" />
          <p className="text-sm text-[var(--color-text-secondary)]">{error ?? "Complaint not found."}</p>
          <Link href="/sub-district-admin/dashboard/complaints"
            className="text-xs text-amber-400 hover:underline">← Back to Complaints</Link>
        </DashboardCard>
      </div>
    );
  }

  const statusStyle = STATUS_STYLE[complaint.status];
  const severityCfg = SEVERITY_CONFIG[complaint.severity] ?? SEVERITY_CONFIG.MEDIUM;
  const categoryGuess = complaint.aiResult?.suggestedCategory ?? complaint.description?.split(" ").slice(0, 3).join(" ") ?? "General";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <Breadcrumb id={complaint.id} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{ background: "var(--color-card)", borderColor: "rgba(249,115,22,0.35)", color: "#f97316" }}
          >
            <CheckCircle2 size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/sub-district-admin/dashboard/complaints">
            <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5">
              <ArrowLeft size={15} /> Back
            </motion.button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {complaint.id.slice(0, 12)}…
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border"
                style={{ color: severityCfg.color, borderColor: severityCfg.border, background: severityCfg.bg }}>
                {severityCfg.label}
              </span>
              <span className={`dashboard-table-badge ${statusStyle.cls}`}>{statusStyle.label}</span>
            </div>
            <h1 className="text-base font-bold text-[var(--color-text-primary)] leading-snug max-w-xl">
              {complaint.description?.slice(0, 80) ?? "Complaint Detail"}
              {(complaint.description?.length ?? 0) > 80 ? "…" : ""}
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* ── Left (2/3) ── */}
        <div className="flex flex-col gap-3 lg:col-span-2">

          {/* Case Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Summary</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {complaint.description ?? "No description provided."}
              </p>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Reported On", value: fmtDate(complaint.createdAt) },
                  { label: "Citizen", value: complaint.citizenName },
                  { label: "Severity", value: severityCfg.label },
                  { label: "Status", value: statusStyle.label },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">{m.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* AI Result badge */}
              {complaint.aiResult && (
                <div className="rounded-xl border p-3" style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-[var(--color-text-primary)]">AI Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    {complaint.aiResult.suggestedCategory && (
                      <div>
                        <span className="text-[var(--color-text-muted)]">Category: </span>
                        <span className="font-medium text-[var(--color-text-primary)]">{complaint.aiResult.suggestedCategory}</span>
                      </div>
                    )}
                    {complaint.aiResult.suggestedSeverity && (
                      <div>
                        <span className="text-[var(--color-text-muted)]">Severity: </span>
                        <span className="font-medium text-[var(--color-text-primary)]">{complaint.aiResult.suggestedSeverity}</span>
                      </div>
                    )}
                    {complaint.aiResult.confidence != null && (
                      <div>
                        <span className="text-[var(--color-text-muted)]">Confidence: </span>
                        <span className="font-mono font-bold text-amber-400">{(complaint.aiResult.confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DashboardCard>
          </motion.div>

          {/* AI Object Detection Panel */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <AdminAIAnnotatedPanel complaintId={complaint.id} category={categoryGuess} />
          </motion.div>

          {/* Location */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "var(--sda-amber)" }} />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Location</h3>
                </div>
                <a href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: "var(--sda-amber)" }}>
                  <ExternalLink size={10} /> Open in Maps
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="text-xs font-mono font-bold text-[var(--color-text-primary)]">
                    {complaint.latitude.toFixed(6)}°N
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Latitude</div>
                </div>
                <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="text-xs font-mono font-bold text-[var(--color-text-primary)]">
                    {complaint.longitude.toFixed(6)}°E
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Longitude</div>
                </div>
              </div>

              {/* Static map preview */}
              <div className="rounded-xl overflow-hidden border border-[var(--color-border)] aspect-video relative bg-[var(--color-surface)]">
                <iframe
                  title="Complaint Location"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${complaint.longitude - 0.005},${complaint.latitude - 0.005},${complaint.longitude + 0.005},${complaint.latitude + 0.005}&layer=mapnik&marker=${complaint.latitude},${complaint.longitude}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </DashboardCard>
          </motion.div>

          {/* Evidence Gallery */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Camera size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence</h3>
                <span className="text-[10px] text-[var(--color-text-muted)]">({complaint.mediaUrls.length} files)</span>
              </div>

              {complaint.mediaUrls.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-text-muted)]">No evidence uploaded by citizen</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {complaint.mediaUrls.map((url, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setLightbox(i)}
                      className="relative aspect-video rounded-xl border overflow-hidden cursor-zoom-in group"
                      style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.05)" }}
                    >
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn size={16} className="text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-2 py-1.5">
                        <p className="text-[10px] font-medium text-white">Evidence {i + 1}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </DashboardCard>
          </motion.div>

          {/* Activity / Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Timeline</h3>
              </div>
              <div className="activity-timeline">
                <div className="sda-activity-timeline-line activity-timeline-line" />
                <div className="activity-timeline-list">
                  <div className="activity-timeline-item">
                    <div className="activity-timeline-icon sda-activity-timeline-icon-amber">
                      <Clock size={12} />
                    </div>
                    <div className="activity-timeline-body">
                      <div className="activity-timeline-meta">
                        <span className="activity-timeline-title">Citizen</span>
                        <span className="activity-timeline-time">{fmtDateTime(complaint.createdAt)}</span>
                      </div>
                      <p className="activity-timeline-desc">Complaint submitted by {complaint.citizenName}</p>
                    </div>
                  </div>
                  {complaint.status !== "SUBMITTED" && complaint.status !== "DRAFT" && (
                    <div className="activity-timeline-item">
                      <div className="activity-timeline-icon activity-timeline-icon-info">
                        <Activity size={12} />
                      </div>
                      <div className="activity-timeline-body">
                        <div className="activity-timeline-meta">
                          <span className="activity-timeline-title">System</span>
                          <span className="activity-timeline-time">—</span>
                        </div>
                        <p className="activity-timeline-desc">Status updated to {STATUS_STYLE[complaint.status].label}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* ── Right (1/3) ── */}
        <div className="flex flex-col gap-3">

          {/* Status Update Panel */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <StatusUpdatePanel
              complaint={complaint}
              onUpdate={handleStatusUpdate}
              isUpdating={isUpdating}
            />
          </motion.div>

          {/* Complaint Metadata */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Complaint Info</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Full ID", value: complaint.id },
                  { label: "Citizen", value: complaint.citizenName },
                  { label: "Severity", value: severityCfg.label },
                  { label: "Created", value: fmtDateTime(complaint.createdAt) },
                  { label: "GPS", value: `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}` },
                  { label: "Media", value: `${complaint.mediaUrls.length} file(s)` },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-2 py-1 border-b border-[var(--color-border)] last:border-0">
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">{item.label}</span>
                    <span className="text-[11px] text-[var(--color-text-primary)] font-medium text-right break-all max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                Quick Actions
              </p>
              <a href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                target="_blank" rel="noopener noreferrer">
                <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                  style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "var(--color-info)" }}>
                  <MapPin size={14} /> View on Google Maps
                </motion.button>
              </a>
              <Link href="/sub-district-admin/dashboard/complaints">
                <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
                  <RefreshCw size={14} /> Back to All Complaints
                </motion.button>
              </Link>
            </DashboardCard>
          </motion.div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && complaint.mediaUrls.length > 0 && (
          <Lightbox
            images={complaint.mediaUrls}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onPrev={() => setLightbox((lightbox - 1 + complaint.mediaUrls.length) % complaint.mediaUrls.length)}
            onNext={() => setLightbox((lightbox + 1) % complaint.mediaUrls.length)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
