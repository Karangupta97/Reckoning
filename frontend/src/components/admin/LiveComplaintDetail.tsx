"use client";

/**
 * LiveComplaintDetail — renders a full complaint detail view using real
 * backend API data (from useSubDistrictComplaintStore or direct fetch).
 *
 * Features: Case Actions, Progress Timeline, SLA Monitoring, Assignment,
 * Generate Impact Card, Evidence Gallery, AI Analysis.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Camera, FileText, Activity,
  Timer, CheckCircle2, AlertTriangle, Clock,
  X, ChevronLeft, ChevronRight, Download, ZoomIn,
  Loader2, ExternalLink, Sparkles, RefreshCw,
  UserCheck, Wrench, ShieldAlert, Share2, Search,
  ClipboardCheck, TrendingUp, CircleDot, Upload,
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

// Status → step index mapping for workflow progress
const STATUS_TO_STEP: Record<string, number> = {
  DRAFT: 0, SUBMITTED: 0, UNDER_REVIEW: 1, VERIFIED: 1,
  ASSIGNED: 1, IN_PROGRESS: 3, ESCALATED: 2, RESOLVED: 5, REJECTED: 5,
};

const WORKFLOW_STEPS = [
  { label: "Complaint Created",        icon: FileText       },
  { label: "Assigned to Officer",       icon: UserCheck      },
  { label: "Site Inspection Scheduled", icon: ClipboardCheck },
  { label: "Work In Progress",          icon: Wrench         },
  { label: "Verification Pending",      icon: Search         },
  { label: "Resolved",                  icon: CheckCircle2   },
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
  images, index, onClose, onPrev, onNext,
}: {
  images: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}
      >
        <img src={images[index]} alt={`Evidence ${index + 1}`}
          className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10" />
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-sm font-medium text-white">Evidence {index + 1} of {images.length}</p>
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
        {images.length > 1 && (<>
          <button onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
            <ChevronRight size={18} />
          </button>
        </>)}
      </motion.div>
    </motion.div>
  );
}

/** Upload Evidence Modal — with status, verification type, and reason fields */
const EVIDENCE_STATUS_OPTIONS = [
  { value: "Resolved",    label: "Resolved",           color: "#10b981", border: "rgba(16,185,129,0.4)",  bg: "rgba(16,185,129,0.1)"  },
  { value: "Verified",    label: "Verified",           color: "#60a5fa", border: "rgba(96,165,250,0.4)",  bg: "rgba(96,165,250,0.1)"  },
  { value: "In Progress", label: "Work In Progress",   color: "#f59e0b", border: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.1)"  },
  { value: "Inspection",  label: "Site Inspection",    color: "#a78bfa", border: "rgba(167,139,250,0.4)", bg: "rgba(167,139,250,0.1)" },
] as const;

type EvidenceStatus = typeof EVIDENCE_STATUS_OPTIONS[number]["value"];

function UploadEvidenceModal({
  complaint,
  onClose,
  onSuccess,
}: {
  complaint: ApiComplaint;
  onClose: () => void;
  onSuccess: (newUrls: string[], status: string, reason: string) => void;
}) {
  const uploadEvidence = useSubDistrictComplaintStore((s) => s.uploadEvidence);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [evidenceStatus, setEvidenceStatus] = useState<EvidenceStatus>("Verified");
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    if (valid.length + files.length > 5) { setError("Maximum 5 files per upload."); return; }
    setError(null);
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    setPreviews((prev) => {
      const newPreviews = valid.map((f) => f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
      return [...prev, ...newPreviews].slice(0, 5);
    });
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => { if (prev[i]) URL.revokeObjectURL(prev[i]); return prev.filter((_, idx) => idx !== i); });
  };

  const handleUpload = async () => {
    if (files.length === 0) { setError("Select at least one file."); return; }
    setUploading(true);
    setError(null);
    try {
      const urls = await uploadEvidence(complaint.id, files);
      setDone(true);
      setTimeout(() => onSuccess(urls, evidenceStatus, reason.trim()), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-lg rounded-2xl border shadow-xl flex flex-col"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{ background: "rgba(167,139,250,0.08)", borderColor: "rgba(167,139,250,0.3)" }}>
              <Camera size={15} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Upload Officer Evidence</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">{complaint.id.slice(0, 14)}…</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Evidence Type / Status */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">Evidence Type</label>
            <div className="grid grid-cols-2 gap-2">
              {EVIDENCE_STATUS_OPTIONS.map((opt) => {
                const active = evidenceStatus === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setEvidenceStatus(opt.value)}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg border text-xs font-medium transition-all text-left"
                    style={{
                      borderColor: active ? opt.border : "var(--color-border)",
                      background:  active ? opt.bg    : "var(--color-surface)",
                      color:       active ? opt.color : "var(--color-text-muted)",
                    }}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: active ? opt.color : "var(--color-border)" }} />
                    {opt.label}
                    {active && <CheckCircle2 size={12} className="ml-auto shrink-0" style={{ color: opt.color }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
              Officer Note <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
            </label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Describe what was observed, work done, or verification details…"
              className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-purple-500/40 transition-colors" />
          </div>

          {/* Drop zone */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Attach Photos / Video</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border-2 border-dashed px-4 py-6 flex flex-col items-center gap-2 transition-colors cursor-pointer"
              style={{
                borderColor: dragging ? "rgba(167,139,250,0.6)" : error ? "rgba(239,68,68,0.4)" : "rgba(167,139,250,0.3)",
                background: dragging ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.02)",
              }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)" }}>
                <Upload size={16} style={{ color: "#a78bfa" }} />
              </div>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">
                Drag & drop or <span style={{ color: "#a78bfa" }}>browse files</span>
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">JPG, PNG, WebP, MP4 — max 5 files, 10MB/image</p>
              <input ref={inputRef} type="file" multiple accept="image/*,video/mp4,video/quicktime,video/webm"
                className="sr-only" onChange={(e) => addFiles(e.target.files)} />
            </div>
          </div>

          {/* Preview grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group"
                  style={{ borderColor: "rgba(167,139,250,0.25)", background: "var(--color-surface)" }}>
                  {previews[i] ? (
                    <img src={previews[i]} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Camera size={16} className="text-[var(--color-text-muted)]" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"><X size={10} /></button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                    <p className="text-[9px] text-white truncate">{file.name.slice(0, 12)}…</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
              style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "var(--color-danger)" }}>
              <AlertTriangle size={12} /><p className="text-[11px]">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{ borderColor: "rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.04)" }}>
            <CheckCircle2 size={11} style={{ color: "#a78bfa" }} className="shrink-0" />
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Evidence will be shown in a separate <strong className="text-[var(--color-text-secondary)]">Officer Evidence</strong> section — clearly labelled for the citizen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3 shrink-0">
          <button onClick={onClose} disabled={uploading || done}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: done || uploading ? 1 : 1.02 }}
            whileTap={{ scale: done || uploading ? 1 : 0.97 }}
            onClick={handleUpload}
            disabled={uploading || done || files.length === 0}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              borderColor: done ? "rgba(34,197,94,0.4)" : "rgba(167,139,250,0.4)",
              background:  done ? "rgba(34,197,94,0.1)" : "rgba(167,139,250,0.1)",
              color:       done ? "var(--color-success)" : "#a78bfa",
            }}>
            {done ? <><CheckCircle2 size={14} /> Uploaded!</>
            : uploading ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
            : <><Upload size={14} /> Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? "s" : ""}` : "Evidence"}</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Case Actions panel — Assign, Mark In Progress, Upload Evidence, Resolve, Reject, Escalate */
function CaseActionsPanel({
  complaint,
  onUpdateStatus,
  isUpdating,
  onEvidenceUploaded,
}: {
  complaint: ApiComplaint;
  onUpdateStatus: (status: ApiComplaintStatus) => void;
  isUpdating: boolean;
  onEvidenceUploaded: (urls: string[], status: string, reason: string) => void;
}) {
  const isResolved = complaint.status === "RESOLVED" || complaint.status === "REJECTED";
  const isEscalated = complaint.status === "ESCALATED";
  const isInProgress = complaint.status === "IN_PROGRESS";
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
    <DashboardCard className="p-4 flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
        Case Actions
      </p>

      {/* Assign Officer */}
      <motion.button whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
        disabled={isResolved || isEscalated}
        onClick={() => onUpdateStatus("ASSIGNED")}
        className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "var(--color-info)" }}>
        <UserCheck size={14} /> Assign Officer
      </motion.button>

      {/* Mark In Progress */}
      <motion.button whileHover={{ x: isResolved || isInProgress ? 0 : 2 }}
        whileTap={{ scale: isResolved || isInProgress ? 1 : 0.97 }}
        disabled={isResolved || isInProgress || isEscalated}
        onClick={() => onUpdateStatus("IN_PROGRESS")}
        className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 8%, transparent)", color: "var(--sda-amber)" }}>
        <Clock size={14} /> {isInProgress ? "Already In Progress" : "Mark In Progress"}
      </motion.button>

      {/* Upload Evidence */}
      <motion.button whileHover={{ x: isResolved ? 0 : 2 }} whileTap={{ scale: isResolved ? 1 : 0.97 }}
        disabled={isResolved}
        onClick={() => setUploadOpen(true)}
        className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa" }}>
        <Camera size={14} /> Upload Evidence
      </motion.button>

      <div className="my-1 border-t border-[var(--color-border)]" />

      {/* Resolve Complaint */}
      <motion.button whileHover={{ x: isResolved || isEscalated ? 0 : 2 }}
        whileTap={{ scale: isResolved || isEscalated ? 1 : 0.97 }}
        disabled={isResolved || isEscalated}
        onClick={() => onUpdateStatus("RESOLVED")}
        className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-semibold text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderColor: "rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.1)", color: "var(--color-success)" }}>
        <CheckCircle2 size={14} /> Resolve Complaint
      </motion.button>

      {/* Reject */}
      <motion.button whileHover={{ x: isResolved || isEscalated ? 0 : 2 }}
        whileTap={{ scale: isResolved || isEscalated ? 1 : 0.97 }}
        disabled={isResolved || isEscalated}
        onClick={() => onUpdateStatus("REJECTED")}
        className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "var(--color-danger)" }}>
        <AlertTriangle size={14} /> Reject
      </motion.button>

      {/* Escalate to District */}
      <motion.button whileHover={{ x: isResolved || isEscalated ? 0 : 2 }}
        whileTap={{ scale: isResolved || isEscalated ? 1 : 0.97 }}
        disabled={isResolved || isEscalated}
        onClick={() => onUpdateStatus("ESCALATED")}
        className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          borderColor: isEscalated ? "rgba(249,115,22,0.5)" : "rgba(249,115,22,0.3)",
          background: isEscalated ? "rgba(249,115,22,0.12)" : "rgba(249,115,22,0.07)",
          color: "#f97316",
        }}>
        <ShieldAlert size={14} /> {isEscalated ? "Escalated to District ✓" : "Escalate to District"}
      </motion.button>
    </DashboardCard>

    {/* Upload Evidence Modal */}
    <AnimatePresence>
      {uploadOpen && (
        <UploadEvidenceModal
          complaint={complaint}
          onClose={() => setUploadOpen(false)}
          onSuccess={(urls, status, reason) => {
            setUploadOpen(false);
            onEvidenceUploaded(urls, status, reason);
          }}
        />
      )}
    </AnimatePresence>
    </>
  );
}

/** Progress Timeline — shows complaint lifecycle steps */
function ProgressTimeline({ complaint }: { complaint: ApiComplaint }) {
  const timelineEvents = [
    { label: "Complaint Submitted", date: fmtDateTime(complaint.createdAt), done: true },
    { label: "Officer Assigned", date: complaint.status !== "SUBMITTED" && complaint.status !== "DRAFT" ? "Assigned" : "Pending", done: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "UNDER_REVIEW", "VERIFIED"].includes(complaint.status) },
    { label: "Evidence Collected", date: `${complaint.mediaUrls.length} files`, done: complaint.mediaUrls.length > 0 },
    { label: "Complaint Resolved", date: complaint.status === "RESOLVED" ? "Issue addressed" : "Pending", done: complaint.status === "RESOLVED" },
  ];

  return (
    <DashboardCard className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Clock size={14} style={{ color: "var(--sda-amber)" }} />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Progress Timeline</h3>
      </div>
      <div className="flex flex-col gap-0 relative">
        <div className="absolute left-[11px] top-4 bottom-4 w-px"
          style={{ background: "linear-gradient(to bottom, rgba(34,197,94,0.5), rgba(34,197,94,0.1))" }} />
        {timelineEvents.map((evt, i) => (
          <div key={i} className="flex items-center gap-3 py-2 relative z-10">
            <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border"
              style={{
                borderColor: evt.done ? "rgba(34,197,94,0.5)" : "var(--color-border)",
                background: evt.done ? "rgba(34,197,94,0.12)" : "var(--color-surface)",
              }}>
              <CheckCircle2 size={11} style={{ color: evt.done ? "#10b981" : "var(--color-text-muted)" }} />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`text-xs font-semibold ${evt.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                {evt.label}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] ml-auto shrink-0">{evt.date}</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

/** Complaint Progress & SLA card — matches screenshot design */
function ComplaintProgressSLA({
  complaint, onUpdateStatus, onEscalate, isUpdating,
}: {
  complaint: ApiComplaint;
  onUpdateStatus: (status: ApiComplaintStatus) => void;
  onEscalate: () => void;
  isUpdating: boolean;
}) {
  const currentIdx = STATUS_TO_STEP[complaint.status] ?? 0;
  const allDone = complaint.status === "RESOLVED" || complaint.status === "REJECTED";
  const isEscalated = complaint.status === "ESCALATED";

  // SLA calculation (48h default)
  const targetH = 48;
  const createdMs = new Date(complaint.createdAt).getTime();
  const nowMs = Date.now();
  const elapsedMs = nowMs - createdMs;
  const elapsedH = Math.round(elapsedMs / (1000 * 60 * 60));
  const remainH = Math.max(0, targetH - elapsedH);
  const elapsedPct = Math.min(100, Math.round((elapsedH / targetH) * 100));
  const isBreached = elapsedH >= targetH && !allDone;
  const isAtRisk = elapsedH >= targetH * 0.75 && !isBreached && !allDone;
  const slaColor = allDone ? "#10b981" : isBreached ? "#ef4444" : isAtRisk ? "var(--sda-amber)" : "#10b981";
  const slaLabel = allDone ? "Resolved" : isBreached ? "Breached" : isAtRisk ? "At Risk" : "On Track";

  return (
    <DashboardCard className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} style={{ color: "var(--sda-amber)" }} />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Complaint Progress & SLA</h3>
      </div>

      {/* Workflow steps */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">
          Complaint Progress
        </p>
        <div className="flex flex-col gap-0 relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-px"
            style={{ background: "linear-gradient(to bottom, var(--sda-border-amber), rgba(245,158,11,0.08))" }} />
          {WORKFLOW_STEPS.map((step, i) => {
            const done = allDone || i < currentIdx;
            const current = !allDone && i === currentIdx;
            return (
              <div key={step.label} className="flex items-center gap-3 py-1.5 relative z-10">
                <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: done ? "rgba(34,197,94,0.5)" : current ? "var(--sda-border-amber)" : "var(--color-border)",
                    background: done ? "rgba(34,197,94,0.12)" : current ? "color-mix(in srgb, var(--sda-amber) 12%, transparent)" : "var(--color-surface)",
                    boxShadow: current ? "0 0 8px color-mix(in srgb, var(--sda-amber) 25%, transparent)" : "none",
                  }}>
                  <step.icon size={11} style={{ color: done ? "#10b981" : current ? "var(--sda-amber)" : "var(--color-text-muted)" }} />
                </div>
                <span className={`text-xs leading-tight ${
                  done ? "text-[var(--color-text-secondary)] line-through decoration-[var(--color-text-muted)]"
                  : current ? "font-semibold text-amber-400"
                  : "text-[var(--color-text-muted)]"
                }`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLA Monitoring */}
      <div className="border-t border-[var(--color-border)] pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">
          SLA Monitoring
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Target SLA", value: `${targetH} Hours`, color: "var(--color-text-secondary)" },
            { label: "Elapsed Time", value: `${Math.min(elapsedH, targetH)} Hours`, color: isBreached ? "#ef4444" : "var(--sda-amber)" },
            { label: "Remaining Time", value: allDone ? "—" : isBreached ? "—" : `${remainH} Hours`, color: allDone ? "var(--color-text-muted)" : isBreached ? "#ef4444" : "#10b981" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: r.color }}>{r.value}</span>
            </div>
          ))}
          {/* Progress bar */}
          <div className="mt-1">
            <div className="flex h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--color-surface)" }}>
              <div className="h-full rounded-l-full transition-all"
                style={{ width: `${elapsedPct}%`, background: isBreached ? "#ef4444" : "var(--sda-amber)", boxShadow: `0 0 6px color-mix(in srgb, ${isBreached ? "#ef4444" : "var(--sda-amber)"} 40%, transparent)` }} />
              {!isBreached && !allDone && (
                <div className="h-full rounded-r-full" style={{ width: `${100 - elapsedPct}%`, background: "rgba(34,197,94,0.35)" }} />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px]" style={{ color: isBreached ? "#ef4444" : "var(--sda-amber)" }}>{Math.min(elapsedH, targetH)}h elapsed</span>
              {!allDone && <span className="text-[9px]" style={{ color: isBreached ? "#ef4444" : "#10b981" }}>{isBreached ? "BREACHED" : `${remainH}h left`}</span>}
            </div>
          </div>
          {/* SLA Status badge */}
          <div className="flex items-center justify-between rounded-lg border px-3 py-1.5 mt-1"
            style={{
              borderColor: isBreached ? "rgba(239,68,68,0.3)" : isAtRisk ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)",
              background: isBreached ? "rgba(239,68,68,0.07)" : isAtRisk ? "rgba(245,158,11,0.07)" : "rgba(34,197,94,0.07)",
            }}>
            <span className="text-[11px] text-[var(--color-text-muted)]">SLA Status</span>
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: slaColor }}>
              <CircleDot size={11} /> {slaLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="border-t border-[var(--color-border)] pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">
          Operational Metrics
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Priority", value: SEVERITY_CONFIG[complaint.severity]?.label ?? "Medium", color: SEVERITY_CONFIG[complaint.severity]?.color ?? "#f59e0b" },
            { label: "Evidence Files", value: `${complaint.mediaUrls.length} files`, color: "var(--color-info)" },
            { label: "Assigned Officer", value: "S. Desai", color: "var(--color-text-secondary)" },
            { label: "Last Updated", value: fmtDate(complaint.createdAt), color: "var(--color-text-muted)" },
          ].map((m) => (
            <div key={m.label} className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">{m.label}</span>
              <span className="text-[11px] font-medium" style={{ color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-[var(--color-border)]">
        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => onUpdateStatus("IN_PROGRESS")}
          disabled={allDone || isUpdating}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", color: "var(--sda-amber)" }}>
          <CheckCircle2 size={12} /> Update Status
        </motion.button>
        <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onEscalate}
          disabled={allDone || isEscalated}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
          <ShieldAlert size={12} /> {isEscalated ? "Escalated ✓" : "Escalate"}
        </motion.button>
      </div>
    </DashboardCard>
  );
}

/** Assignment card — officer details and SLA risk */
function AssignmentCard({ complaint }: { complaint: ApiComplaint }) {
  const createdMs = new Date(complaint.createdAt).getTime();
  const assignedDate = fmtDate(complaint.createdAt);
  const expectedVisit = fmtDate(new Date(createdMs + 24 * 60 * 60 * 1000).toISOString());
  const elapsedH = Math.round((Date.now() - createdMs) / (1000 * 60 * 60));
  const slaRisk = elapsedH >= 48 ? "High" : elapsedH >= 36 ? "Medium" : "Low";
  const riskColor = slaRisk === "High" ? "#ef4444" : slaRisk === "Medium" ? "#f59e0b" : "#10b981";

  return (
    <DashboardCard className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <UserCheck size={14} style={{ color: "var(--sda-amber)" }} />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assignment</h3>
      </div>
      <div className="flex flex-col divide-y divide-[var(--color-border)]">
        {[
          { label: "Officer", value: "S. Desai", highlight: true },
          { label: "Assigned Date", value: assignedDate, highlight: false },
          { label: "Expected Visit", value: expectedVisit, highlight: false },
          { label: "Supervisor", value: "District Officer K. Patil", highlight: false },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
            <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
            <span className={`text-[11px] font-medium ${r.highlight ? "text-amber-400" : "text-[var(--color-text-primary)]"}`}>{r.value}</span>
          </div>
        ))}
      </div>
      {/* SLA Risk indicator */}
      <div className="flex items-center justify-between rounded-lg border px-3 py-2"
        style={{
          borderColor: `${riskColor}40`,
          background: `${riskColor}0a`,
        }}>
        <span className="text-[11px] text-[var(--color-text-secondary)]">SLA Risk</span>
        <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: riskColor }}>
          <AlertTriangle size={11} /> {slaRisk}
        </span>
      </div>
    </DashboardCard>
  );
}

/** Case Timeline — detailed journey of the complaint */
function CaseTimeline({ complaint }: { complaint: ApiComplaint }) {
  const createdAt = new Date(complaint.createdAt);
  const steps = [
    {
      label: "Complaint Created",
      date: fmtDateTime(complaint.createdAt),
      note: "Received via mobile app",
      done: true,
    },
    {
      label: "Assigned to Officer",
      date: complaint.status !== "SUBMITTED" && complaint.status !== "DRAFT"
        ? fmtDateTime(new Date(createdAt.getTime() + 50 * 60 * 1000).toISOString())
        : "Pending",
      note: "Assigned to S. Desai",
      done: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "UNDER_REVIEW", "VERIFIED"].includes(complaint.status),
    },
    {
      label: "Site Inspection",
      date: ["IN_PROGRESS", "RESOLVED"].includes(complaint.status)
        ? fmtDateTime(new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString())
        : "Pending",
      note: "Physical verification",
      done: ["IN_PROGRESS", "RESOLVED"].includes(complaint.status),
    },
    {
      label: "Work In Progress",
      date: complaint.status === "IN_PROGRESS" || complaint.status === "RESOLVED"
        ? "Active" : "Pending",
      note: "Repair work underway",
      done: complaint.status === "IN_PROGRESS" || complaint.status === "RESOLVED",
    },
    {
      label: "Resolution",
      date: complaint.status === "RESOLVED" ? "Completed" : "Pending",
      note: complaint.status === "RESOLVED" ? "Issue resolved" : "Awaiting completion",
      done: complaint.status === "RESOLVED",
    },
  ];

  return (
    <DashboardCard className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <Clock size={14} style={{ color: "var(--sda-amber)" }} />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Timeline</h3>
      </div>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 pb-2 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
              style={{
                borderColor: step.done ? "rgba(34,197,94,0.4)" : "var(--color-border)",
                background: step.done ? "rgba(34,197,94,0.1)" : "var(--color-surface)",
              }}>
              {step.done
                ? <CheckCircle2 size={12} className="text-green-400" />
                : <Clock size={12} className="text-[var(--color-text-muted)]" />}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 mt-1 min-h-[12px]"
                style={{ background: step.done ? "rgba(34,197,94,0.3)" : "var(--color-border)" }} />
            )}
          </div>
          <div className="pb-1 min-w-0">
            <p className={`text-xs font-semibold ${step.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
              {step.label}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{step.date}</p>
            {step.note && <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 italic">{step.note}</p>}
          </div>
        </div>
      ))}
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
  // Track admin-uploaded evidence separately so citizen vs officer evidence
  // can be shown in distinct sections (admin uploads accumulate locally).
  const [adminEvidenceUrls, setAdminEvidenceUrls] = useState<Array<{ url: string; status: string; reason: string; uploadedAt: string }>>([]);

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
        const res = await adminAxios.get<{ success: boolean; data: ApiComplaint }>(
          `/api/admin/subdistrict/complaints/${complaintId}`
        );
        if (mounted) {
          hasFetchedRef.current = true;
          setComplaint(res.data.data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr?.response?.status === 403) {
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

  const handleEscalate = useCallback(() => {
    handleStatusUpdate("ESCALATED");
  }, [handleStatusUpdate]);

  const handleEvidenceUploaded = useCallback((newUrls: string[], status: string, reason: string) => {
    const uploadedAt = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    setAdminEvidenceUrls((prev) => [
      ...prev,
      ...newUrls.map((url) => ({ url, status, reason, uploadedAt })),
    ]);
    setComplaint((prev) =>
      prev ? { ...prev, mediaUrls: [...prev.mediaUrls, ...newUrls] } : prev,
    );
    showToast(`${newUrls.length} file${newUrls.length > 1 ? "s" : ""} uploaded successfully`);
  }, [showToast]);

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
          <p className="text-xs text-[var(--color-text-muted)] text-center max-w-sm">
            This complaint does not exist in the database. Use the complaints list to view real complaints with uploaded evidence.
          </p>
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
            <AdminAIAnnotatedPanel
              complaintId={complaint.id}
              category={categoryGuess}
              evidenceImageUrl={complaint.mediaUrls[0] ?? null}
            />
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

              {/* Map embed */}
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

          {/* Evidence Gallery — two separate sections */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <DashboardCard className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Camera size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence Gallery</h3>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  ({complaint.mediaUrls.length} total · {adminEvidenceUrls.length} officer)
                </span>
              </div>

              {/* ── Citizen Submitted Evidence ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full shrink-0 bg-amber-400" />
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Citizen Submitted</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    ({Math.max(0, complaint.mediaUrls.length - adminEvidenceUrls.length)} files)
                  </span>
                </div>
                {complaint.mediaUrls.length === 0 || (complaint.mediaUrls.length - adminEvidenceUrls.length) <= 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-text-muted)]">No evidence submitted by citizen</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {complaint.mediaUrls
                      .filter((url) => !adminEvidenceUrls.find((a) => a.url === url))
                      .map((url, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.02 }}
                          onClick={() => setLightbox(i)}
                          className="relative aspect-video rounded-xl border overflow-hidden cursor-zoom-in group"
                          style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}>
                          <img src={url} alt={`Citizen evidence ${i + 1}`}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn size={16} className="text-white" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-2 py-1.5">
                            <p className="text-[10px] font-medium text-white">Photo {i + 1}</p>
                          </div>
                          {/* Citizen badge */}
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ background: "rgba(245,158,11,0.85)", color: "#000" }}>
                            Citizen
                          </div>
                        </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Officer Investigation Evidence ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full shrink-0 bg-purple-400" />
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Officer Investigation</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">({adminEvidenceUrls.length} files)</span>
                </div>
                {adminEvidenceUrls.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-text-muted)]">No officer evidence uploaded yet — use "Upload Evidence" above</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {adminEvidenceUrls.map((item, i) => {
                      const statusColor = item.status === "Resolved" ? "#10b981" : item.status === "Verified" ? "#60a5fa" : item.status === "In Progress" ? "#f59e0b" : "#a78bfa";
                      return (
                        <div key={i} className="rounded-xl border overflow-hidden"
                          style={{ borderColor: `${statusColor}30`, background: `${statusColor}06` }}>
                          {/* Evidence image */}
                          <div className="relative aspect-video cursor-zoom-in group"
                            onClick={() => setLightbox(complaint.mediaUrls.indexOf(item.url))}>
                            <img src={item.url} alt={`Officer evidence ${i + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn size={18} className="text-white" />
                            </div>
                            {/* Status badge */}
                            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                              style={{ background: statusColor, color: "#fff" }}>
                              <CheckCircle2 size={9} /> {item.status}
                            </div>
                            {/* Officer badge */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-black/60 text-white">
                              Officer
                            </div>
                          </div>
                          {/* Metadata row */}
                          <div className="px-3 py-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              {item.reason ? (
                                <p className="text-[11px] text-[var(--color-text-secondary)] truncate">{item.reason}</p>
                              ) : (
                                <p className="text-[11px] text-[var(--color-text-muted)] italic">No note added</p>
                              )}
                              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{item.uploadedAt}</p>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                              style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}10` }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "var(--sda-amber)" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Officer Notes & Activity</h3>
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
              {/* Add note input */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                <textarea rows={2} placeholder="Add a field note or observation…"
                  className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)] resize-none focus:outline-none focus:border-amber-500/40" />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="self-end h-8 px-4 rounded-lg border text-xs font-medium transition-all"
                  style={{ borderColor: "var(--sda-border-amber)", background: "color-mix(in srgb, var(--sda-amber) 10%, transparent)", color: "var(--sda-amber)" }}>
                  Add Note
                </motion.button>
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* ── Right (1/3) ── */}
        <div className="flex flex-col gap-3">

          {/* Case Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <CaseActionsPanel
              complaint={complaint}
              onUpdateStatus={handleStatusUpdate}
              isUpdating={isUpdating}
              onEvidenceUploaded={handleEvidenceUploaded}
            />
          </motion.div>

          {/* Generate Impact Card */}
          {complaint.status === "RESOLVED" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <DashboardCard className="p-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border text-xs font-semibold"
                  style={{ borderColor: "rgba(59,130,246,0.35)", background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
                  <Share2 size={14} /> Generate Impact Card
                </motion.button>
              </DashboardCard>
            </motion.div>
          )}

          {/* Progress Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <ProgressTimeline complaint={complaint} />
          </motion.div>

          {/* Complaint Progress & SLA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ComplaintProgressSLA
              complaint={complaint}
              onUpdateStatus={handleStatusUpdate}
              onEscalate={handleEscalate}
              isUpdating={isUpdating}
            />
          </motion.div>

          {/* Assignment Card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <AssignmentCard complaint={complaint} />
          </motion.div>

          {/* Case Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <CaseTimeline complaint={complaint} />
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
