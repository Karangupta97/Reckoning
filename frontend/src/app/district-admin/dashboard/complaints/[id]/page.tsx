"use client";

/**
 * District Admin — Complaint Detail
 *
 * Works for both:
 *   • CMP-* ids (mock/Zustand store data)  — used in dev / demo
 *   • Real DB ids (fetched from GET /api/admin/my-district/escalations)
 *
 * District Actions are fully wired:
 *   Mark In Progress  → PATCH .../status {status:"IN_PROGRESS"} + store sync
 *   Mark Resolved     → PATCH .../status {status:"RESOLVED"}    + store sync
 *   Escalate to SA    → escalationStore.escalateToSuperAdmin    + notification
 *
 * Banner: teal info banner when status === ESCALATED_TO_DISTRICT.
 * Shows escalatedBy admin name + escalatedAt timestamp.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ShieldAlert, Info, Calendar, UserCheck,
  MapPin, FileText, CheckCircle2, AlertTriangle,
  Clock, Loader2, ExternalLink, Activity, Camera,
  TrendingUp, Timer, ArrowUpRight, X, CircleDot,
  ZoomIn, Download, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { api } from "@/lib/api";
import { adminAxios } from "@/lib/adminAxios";
import { shouldUseMock } from "@/lib/useMock";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { useComplaintStore, toComplaintDetailView } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useAdminNotificationStore } from "@/store/adminNotificationStore";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface LiveComplaint {
  id: string;
  ticketNumber: string;
  category: string;
  severity: string;
  status: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  escalationLevel: number;
  escalatedAt: string | null;
  escalatedBy: string | null;
  escalationReason: string | null;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  /** Pre-signed S3 URLs for complaint media (citizen + officer). */
  mediaUrls?: string[];
  /** AI analysis results. */
  aiResult?: {
    annotatedImageUrl: string | null;
    confidence: number | null;
    suggestedCategory: string | null;
    suggestedSeverity: string | null;
  } | null;
}

const SEVERITY_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  CRITICAL: { text: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)"   },
  HIGH:     { text: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.3)"  },
  MEDIUM:   { text: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)"  },
  LOW:      { text: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.3)"  },
};

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// SLA helper
function calcSla(createdAt: string, deadline: string | null) {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const target = deadline
    ? new Date(deadline).getTime()
    : created + 48 * 3600 * 1000;
  const totalMs  = target - created;
  const elapsed  = Math.min(now - created, totalMs);
  const remain   = Math.max(0, target - now);
  const elapsedH = Math.round(elapsed / 3600000);
  const remainH  = Math.round(remain  / 3600000);
  const pct      = Math.min(100, Math.round((elapsed / totalMs) * 100));
  const breached = now > target;
  const atRisk   = !breached && pct >= 75;
  const color    = breached ? "#ef4444" : atRisk ? "#f59e0b" : "#10b981";
  const label    = breached ? "Breached" : atRisk ? "At Risk" : "On Track";
  return { elapsedH, remainH, pct, breached, atRisk, color, label };
}

// Map store mock status → display
function mapStatus(s: string) {
  const m: Record<string, string> = {
    Open: "SUBMITTED", Assigned: "ASSIGNED", "In Progress": "IN_PROGRESS",
    Resolved: "RESOLVED", Rejected: "REJECTED", Escalated: "ESCALATED_TO_DISTRICT",
  };
  return m[s] ?? s;
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    DRAFT: "Draft", SUBMITTED: "Submitted", UNDER_REVIEW: "Under Review",
    VERIFIED: "Verified", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved", REJECTED: "Rejected", ESCALATED: "Escalated",
    ESCALATED_TO_DISTRICT: "Escalated to District",
    Open: "Open", "In Progress": "In Progress", Escalated: "Escalated",
  };
  return m[s] ?? s.replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// EvidenceGallery — citizen + sub-district officer evidence for district view
// ---------------------------------------------------------------------------

function EvidenceGallery({
  mediaUrls,
  citizenCount,
  aiResult,
  ticketNumber,
}: {
  mediaUrls: string[];
  citizenCount: number;
  aiResult: LiveComplaint["aiResult"];
  ticketNumber: string;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const citizenUrls  = mediaUrls.slice(0, citizenCount);
  const officerUrls  = mediaUrls.slice(citizenCount);
  const allUrls      = mediaUrls;

  return (
    <>
    <DashboardCard className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Camera size={14} style={{ color: "#14b8a6" }} />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Evidence Gallery</h3>
        <span className="text-[10px] text-[var(--color-text-muted)]">({mediaUrls.length} files)</span>
      </div>

      {mediaUrls.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">No evidence attached to this complaint</span>
        </div>
      ) : (
        <>
          {/* Citizen Evidence */}
          {citizenUrls.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full shrink-0 bg-amber-400" />
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Citizen Submitted</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">({citizenUrls.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {citizenUrls.map((url, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }}
                    onClick={() => setLightbox(i)}
                    className="relative aspect-video rounded-xl border overflow-hidden cursor-zoom-in group"
                    style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}>
                    <img src={url} alt={`Citizen evidence ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn size={16} className="text-white" />
                    </div>
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: "rgba(245,158,11,0.85)", color: "#000" }}>
                      Citizen
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Officer Evidence */}
          {officerUrls.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full shrink-0 bg-teal-400" />
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Sub-District Officer</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">({officerUrls.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {officerUrls.map((url, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }}
                    onClick={() => setLightbox(citizenUrls.length + i)}
                    className="relative aspect-video rounded-xl border overflow-hidden cursor-zoom-in group"
                    style={{ borderColor: "rgba(20,184,166,0.2)", background: "rgba(20,184,166,0.04)" }}>
                    <img src={url} alt={`Officer evidence ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn size={16} className="text-white" />
                    </div>
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: "rgba(20,184,166,0.85)", color: "#000" }}>
                      Officer
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {aiResult && (
            <div className="rounded-xl border px-3 py-3"
              style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold text-[var(--color-text-primary)]">AI Analysis</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {aiResult.suggestedCategory && (
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    Category: <span className="font-semibold text-[var(--color-text-primary)]">{aiResult.suggestedCategory.replace(/_/g, " ")}</span>
                  </span>
                )}
                {aiResult.suggestedSeverity && (
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    Severity: <span className="font-semibold text-[var(--color-text-primary)]">{aiResult.suggestedSeverity}</span>
                  </span>
                )}
                {aiResult.confidence != null && (
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    Confidence: <span className="font-mono font-bold text-amber-400">{(aiResult.confidence * 100).toFixed(0)}%</span>
                  </span>
                )}
              </div>
              {aiResult.annotatedImageUrl && (
                <motion.div whileHover={{ scale: 1.01 }}
                  onClick={() => setLightbox(-1)}
                  className="mt-2 relative aspect-video rounded-lg border overflow-hidden cursor-zoom-in"
                  style={{ borderColor: "rgba(245,158,11,0.25)" }}>
                  <img src={aiResult.annotatedImageUrl} alt="AI annotated"
                    className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-black">
                    AI Annotated
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardCard>

    {/* Lightbox */}
    <AnimatePresence>
      {lightbox !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="relative w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}>
            {lightbox === -1 && aiResult?.annotatedImageUrl ? (
              <img src={aiResult.annotatedImageUrl} alt="AI annotated"
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10" />
            ) : lightbox !== null && allUrls[lightbox] ? (
              <img src={allUrls[lightbox]} alt={`Evidence ${lightbox + 1}`}
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10" />
            ) : null}
            <div className="mt-3 flex items-center justify-between px-1">
              <p className="text-sm font-medium text-white">
                {lightbox === -1 ? "AI Annotated Image" : `${ticketNumber} · Evidence ${(lightbox ?? 0) + 1} of ${allUrls.length}`}
              </p>
              <div className="flex items-center gap-2">
                {lightbox !== null && lightbox !== -1 && allUrls[lightbox] && (
                  <a href={allUrls[lightbox]} target="_blank" rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <Download size={14} />
                  </a>
                )}
                <button onClick={() => setLightbox(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            {lightbox !== null && lightbox !== -1 && allUrls.length > 1 && (
              <>
                <button onClick={() => setLightbox(((lightbox ?? 0) - 1 + allUrls.length) % allUrls.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setLightbox(((lightbox ?? 0) + 1) % allUrls.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// EscalateToSuperAdminDialog
// ---------------------------------------------------------------------------

function EscalateToSuperAdminDialog({
  complaintId, ticketNumber, severity, description, address, onClose, onDone,
}: {
  complaintId: string;
  ticketNumber: string;
  severity?: string;
  description?: string;
  address?: string;
  onClose: () => void;
  onDone: (newId: string) => void;
}) {
  const addEscalation        = useEscalationStore((s) => s.addEscalation);
  const escalateToSuperAdmin = useEscalationStore((s) => s.escalateToSuperAdmin);
  const linkedEsc = useEscalationStore((s) =>
    s.escalations.find((e) => e.sourceComplaintId === complaintId)
  );
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [newId, setNewId]     = useState("");

  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      // If no linked escalation exists (real API complaint), create one first
      let escId: string;
      if (linkedEsc) {
        escId = linkedEsc.id;
      } else {
        // Create a district escalation entry so escalateToSuperAdmin has something to work with
        const priorityMap: Record<string, "Critical" | "High" | "Medium" | "Low"> = {
          CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
        };
        escId = addEscalation({
          sourceComplaintId: complaintId,
          title: description?.slice(0, 60) ?? ticketNumber,
          subDistrict: address?.split(",")[1]?.trim() ?? "Sub-District",
          category: "Infrastructure",
          priority: priorityMap[severity ?? ""] ?? "High",
          reason: reason.trim() || "Escalated to Super Admin by District Admin",
          notes: description ?? undefined,
        });
      }

      const superId = escalateToSuperAdmin(escId, {
        priority: linkedEsc?.priority ?? "High",
        reason: reason.trim() || "Requires super-admin intervention",
        description: `Escalated by District Admin from complaint ${ticketNumber}`,
      });
      setNewId(superId);
      setDone(true);
      setLoading(false);
      useAdminNotificationStore.getState().push({
        portal: "super",
        type: "escalation_escalated",
        title: "District escalation received",
        message: `${superId} — ${ticketNumber}`,
        entityId: superId,
        href: `/super-admin/complaints/escalated-cases/${superId}`,
      });
      setTimeout(() => onDone(superId), 900);
    }, 500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="w-full max-w-md rounded-2xl border shadow-xl flex flex-col"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{ background: "rgba(249,115,22,0.1)", borderColor: "rgba(249,115,22,0.3)" }}>
              <ArrowUpRight size={15} style={{ color: "#f97316" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Escalate to Super Admin</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{ticketNumber}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40">
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="rounded-lg border px-3 py-2.5 flex items-start gap-2"
            style={{ borderColor: "rgba(249,115,22,0.25)", background: "rgba(249,115,22,0.06)" }}>
            <Info size={12} className="shrink-0 mt-0.5 text-orange-400" />
            <p className="text-xs text-[var(--color-text-secondary)]">
              {linkedEsc
                ? <>Linked escalation <span className="font-mono font-bold text-orange-400">{linkedEsc.id}</span> will be forwarded to Super Admin for national-level review.</>
                : <>Complaint <span className="font-mono font-bold text-orange-400">{ticketNumber}</span> will be escalated directly to Super Admin as a new district escalation.</>
              }
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
              Reason <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
            </label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Describe why this needs national-level attention…"
              className="w-full rounded-lg border px-3 py-2 text-xs text-[var(--color-text-secondary)] resize-none focus:outline-none transition-colors"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
          <button onClick={onClose} disabled={loading || done}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            Cancel
          </button>
          <motion.button whileHover={{ scale: done || loading ? 1 : 1.02 }}
            whileTap={{ scale: done || loading ? 1 : 0.97 }}
            onClick={submit} disabled={loading || done}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              borderColor: done ? "rgba(34,197,94,0.4)" : "rgba(249,115,22,0.4)",
              background:  done ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
              color:       done ? "var(--color-success)" : "#f97316",
            }}>
            {done ? <><CheckCircle2 size={14} /> Escalated as {newId}</>
             : loading ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />Escalating…</>
             : <><ArrowUpRight size={14} /> Confirm Escalation</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DistrictComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  // Zustand mock-store complaint (CMP-* IDs)
  const storeRecord  = useComplaintStore((s) => s.complaints.find((c) => c.id === id));
  const storeSetStatus = useComplaintStore((s) => s.setStatus);

  // Live API complaint state
  const [live, setLive]         = useState<LiveComplaint | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [superEscOpen, setSuperEscOpen]   = useState(false);
  const [superEscId, setSuperEscId]       = useState<string | null>(null);
  const hasFetched = useRef(false);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Derive a unified display complaint from either mock store or live API
  const isMockId = typeof id === "string" && id.startsWith("CMP-");

  useEffect(() => {
    if (hasFetched.current) return;
    if (isMockId && storeRecord) {
      // CMP-* → use store directly, no fetch needed
      hasFetched.current = true;
      setLoading(false);
      return;
    }
    hasFetched.current = true;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (isMock && !isMockId) {
          await new Promise((r) => setTimeout(r, 300));
          if (mounted) setLoading(false);
          return;
        }
        const res = await api.get("/api/admin/my-district/escalations", { params: { limit: "100" } });
        const items: LiveComplaint[] = res.data?.data?.complaints ?? [];
        const found = items.find((c) => c.id === id);
        if (mounted) {
          if (found) setLive(found);
          else setError("Complaint not found or outside your district jurisdiction.");
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load complaint.");
          setLoading(false);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, isMock, isMockId, storeRecord]);

  // ── District Actions ────────────────────────────────────────────────────

  const handleMarkStatus = useCallback(async (newStatus: "IN_PROGRESS" | "RESOLVED") => {
    if (actionLoading) return;
    setActionLoading(newStatus);
    try {
      if (isMockId) {
        // CMP-* → always use local store, never call the backend
        await new Promise((r) => setTimeout(r, 350));
        if (storeRecord) {
          storeSetStatus(
            id,
            newStatus === "IN_PROGRESS" ? "In Progress" : "Resolved",
            "District Admin",
            `Marked ${newStatus === "IN_PROGRESS" ? "In Progress" : "Resolved"} by District Admin`,
          );
        }
        if (live) setLive({ ...live, status: newStatus });
        showToast(newStatus === "IN_PROGRESS" ? "Marked as In Progress." : "Complaint resolved.");
      } else {
        // Real DB complaint — call the status endpoint (accepts DISTRICT_ADMIN)
        await adminAxios.patch(
          `/api/admin/subdistrict/complaints/${id}/status`,
          { status: newStatus },
        );
        if (live) setLive({ ...live, status: newStatus });
        showToast(newStatus === "IN_PROGRESS" ? "Marked as In Progress." : "Complaint resolved.");
      }
    } catch {
      showToast("Action failed. Please try again.", false);
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, id, isMockId, live, storeRecord, storeSetStatus, showToast]);

  // ── Build display data from store record or live API ───────────────────

  const displayStatus: string = (() => {
    if (storeRecord) return mapStatus(storeRecord.status);
    return live?.status ?? "";
  })();

  const isEscalatedToDistrict =
    displayStatus === "ESCALATED_TO_DISTRICT" || displayStatus === "Escalated";
  const isTerminal =
    displayStatus === "RESOLVED" || displayStatus === "REJECTED" ||
    storeRecord?.status === "Resolved" || storeRecord?.status === "Rejected";

  // Loading / Error guards
  if (loading) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        <Link href="/district-admin/dashboard/complaints">
          <motion.span whileHover={{ x: -2 }}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={15} /> Back to Complaints
          </motion.span>
        </Link>
        <div className="flex items-center justify-center py-20 gap-2">
          <Loader2 size={18} className="animate-spin" style={{ color: "#14b8a6" }} />
          <span className="text-sm text-[var(--color-text-muted)]">Loading complaint…</span>
        </div>
      </div>
    );
  }

  if (!isMockId && (error || (!live && !storeRecord))) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        <Link href="/district-admin/dashboard/complaints">
          <motion.span whileHover={{ x: -2 }}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <ArrowLeft size={15} /> Back to Complaints
          </motion.span>
        </Link>
        <DashboardCard className="p-6 flex flex-col items-center gap-3">
          <AlertTriangle size={22} className="text-amber-400" />
          <p className="text-sm text-[var(--color-text-secondary)]">{error ?? "Complaint not found."}</p>
          <Link href="/district-admin/dashboard/complaints"
            className="text-xs hover:underline" style={{ color: "#14b8a6" }}>
            ← Back to Complaints
          </Link>
        </DashboardCard>
      </div>
    );
  }

  // Build display fields
  const detail = storeRecord ? toComplaintDetailView(storeRecord) : null;
  const ticketNumber = live?.ticketNumber ?? detail?.id ?? id;
  const category     = live?.category     ?? detail?.category ?? "—";
  const severity     = live?.severity     ?? detail?.priority?.toUpperCase() ?? "MEDIUM";
  const description  = live?.description  ?? detail?.description ?? "No description provided.";
  const address      = live?.address      ?? detail?.location ?? "—";
  const lat          = live?.latitude     ?? 18.99;
  const lng          = live?.longitude    ?? 73.12;
  const escalatedAt  = live?.escalatedAt  ?? null;
  const escalatedBy  = live?.escalatedBy  ?? null;
  const escalationReason = live?.escalationReason ?? null;
  const slaDeadline  = live?.slaDeadline  ?? null;
  const createdAt    = live?.createdAt    ?? detail?.createdDate ?? new Date().toISOString();
  const updatedAt    = live?.updatedAt    ?? detail?.updatedDate ?? new Date().toISOString();
  const sevCfg       = SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.MEDIUM;
  const sla          = calcSla(createdAt, slaDeadline);

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{
              background: "var(--color-card)",
              borderColor: toast.ok ? "rgba(20,184,166,0.4)" : "rgba(239,68,68,0.4)",
              color: toast.ok ? "#14b8a6" : "var(--color-danger)",
            }}
          >
            {toast.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back */}
      <Link href="/district-admin/dashboard/complaints">
        <motion.span whileHover={{ x: -2 }}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft size={15} /> Back to Complaints
        </motion.span>
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-bold" style={{ color: "#14b8a6" }}>
          {ticketNumber}
        </span>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
          style={{ color: sevCfg.text, borderColor: sevCfg.border, background: sevCfg.bg }}>
          {severity}
        </span>
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
          style={{
            borderColor: isEscalatedToDistrict ? "rgba(20,184,166,0.4)"  : `${sevCfg.border}`,
            background:  isEscalatedToDistrict ? "rgba(20,184,166,0.12)" : sevCfg.bg,
            color:       isEscalatedToDistrict ? "#14b8a6"               : sevCfg.text,
          }}>
          {isEscalatedToDistrict && <ShieldAlert size={10} />}
          {statusLabel(displayStatus)}
        </motion.span>
        {superEscId && (
          <span className="text-[11px] font-mono text-orange-400">→ {superEscId}</span>
        )}
      </motion.div>

      {/* Escalation info banner */}
      {isEscalatedToDistrict && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)" }}
          role="status">
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#14b8a6" }}>
              This complaint was escalated from sub-district level.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {escalatedBy && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <UserCheck size={12} style={{ color: "#14b8a6" }} />
                  Escalated by <span className="font-semibold text-[var(--color-text-primary)]">{escalatedBy}</span>
                </span>
              )}
              {escalatedAt && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <Calendar size={12} style={{ color: "#14b8a6" }} />
                  {fmtDT(escalatedAt)}
                </span>
              )}
              {escalationReason && (
                <span className="text-xs text-[var(--color-text-muted)] italic">
                  Reason: {escalationReason.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* ── Left 2/3 ── */}
        <div className="flex flex-col gap-3 lg:col-span-2">

          {/* Case Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: "#14b8a6" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Summary</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Category",    value: category.replace(/_/g, " ") },
                  { label: "Severity",    value: severity },
                  { label: "Status",      value: statusLabel(displayStatus) },
                  { label: "Esc. Level",  value: `Level ${live?.escalationLevel ?? 1}` },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">{m.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              {/* Activity log (mock store only) */}
              {detail?.activityLog && detail.activityLog.length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={13} style={{ color: "#14b8a6" }} />
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Activity Log</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {detail.activityLog.slice(0, 5).map((e, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 w-24">{e.time}</span>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          <span className="font-semibold">{e.actor}</span> — {e.action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DashboardCard>
          </motion.div>

          {/* Evidence Gallery */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
            <EvidenceGallery
              mediaUrls={live?.mediaUrls ?? []}
              citizenCount={Math.ceil((live?.mediaUrls?.length ?? 0) * 0.6)}
              aiResult={live?.aiResult ?? null}
              ticketNumber={ticketNumber}
            />
          </motion.div>

          {/* SLA card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Timer size={14} style={{ color: "#14b8a6" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">SLA Monitoring</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Elapsed / Remaining</p>
                  <p className="text-sm font-bold" style={{ color: sla.color }}>
                    {sla.elapsedH}h elapsed
                    {!isTerminal && ` · ${sla.breached ? "BREACHED" : `${sla.remainH}h left`}`}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{ color: sla.color, borderColor: `${sla.color}40`, background: `${sla.color}10` }}>
                  <CircleDot size={11} />
                  {isTerminal ? statusLabel(displayStatus) : sla.label}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--color-surface)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sla.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: sla.color }}
                />
              </div>
              {slaDeadline && (
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  SLA Deadline: {fmtDT(slaDeadline)}
                </p>
              )}
            </DashboardCard>
          </motion.div>

          {/* Location */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "#14b8a6" }} />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Location</h3>
                </div>
                <a href={`https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium hover:underline"
                  style={{ color: "#14b8a6" }}>
                  <ExternalLink size={10} /> Open in Maps
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="text-[12px] text-[var(--color-text-secondary)] break-words">{address}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Address</div>
                </div>
                <div className="rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="text-xs font-mono font-bold text-[var(--color-text-primary)]">
                    {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Coordinates</div>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-[var(--color-border)] aspect-video bg-[var(--color-surface)]">
                <iframe
                  title="Complaint Location"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </DashboardCard>
          </motion.div>
        </div>

        {/* ── Right 1/3 ── */}
        <div className="flex flex-col gap-3">

          {/* District Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                District Actions
              </p>

              {/* Mark In Progress */}
              <motion.button
                whileHover={{ x: isTerminal || displayStatus === "IN_PROGRESS" ? 0 : 2 }}
                whileTap={{ scale: isTerminal || displayStatus === "IN_PROGRESS" ? 1 : 0.97 }}
                disabled={isTerminal || displayStatus === "IN_PROGRESS" || !!actionLoading}
                onClick={() => handleMarkStatus("IN_PROGRESS")}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
                {actionLoading === "IN_PROGRESS"
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Clock size={14} />}
                {displayStatus === "IN_PROGRESS" ? "Already In Progress" : "Mark In Progress"}
              </motion.button>

              {/* Mark Resolved */}
              <motion.button
                whileHover={{ x: isTerminal ? 0 : 2 }}
                whileTap={{ scale: isTerminal ? 1 : 0.97 }}
                disabled={isTerminal || !!actionLoading}
                onClick={() => handleMarkStatus("RESOLVED")}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-semibold text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                {actionLoading === "RESOLVED"
                  ? <Loader2 size={13} className="animate-spin" />
                  : <CheckCircle2 size={14} />}
                {displayStatus === "RESOLVED" ? "Already Resolved ✓" : "Mark Resolved"}
              </motion.button>

              <div className="my-1 border-t border-[var(--color-border)]" />

              {/* Escalate to Super Admin */}
              <motion.button
                whileHover={{ x: isTerminal || superEscId ? 0 : 2 }}
                whileTap={{ scale: isTerminal || superEscId ? 1 : 0.97 }}
                disabled={isTerminal || !!superEscId || !!actionLoading}
                onClick={() => setSuperEscOpen(true)}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
                <ArrowUpRight size={14} />
                {superEscId ? `Escalated as ${superEscId} ✓` : "Escalate to Super Admin"}
              </motion.button>
            </DashboardCard>
          </motion.div>

          {/* Escalation Details */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: "#14b8a6" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Escalation Details</h3>
              </div>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {[
                  { label: "Escalated By",  value: escalatedBy ?? (detail ? "Sub-District Officer" : "—") },
                  { label: "Escalated At",  value: escalatedAt ? fmtDT(escalatedAt) : (detail?.updatedDate ?? "—") },
                  { label: "Reason",        value: (escalationReason ?? "Manual Escalation").replace(/_/g, " ") },
                  { label: "SLA Deadline",  value: slaDeadline ? fmtDT(slaDeadline) : detail?.resolutionTarget ?? "—" },
                  { label: "Reported",      value: createdAt.includes("T") ? fmtDT(createdAt) : createdAt },
                  { label: "Last Updated",  value: updatedAt.includes("T") ? fmtDT(updatedAt) : updatedAt },
                ].map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0 w-24">{r.label}</span>
                    <span className="text-[11px] font-medium text-[var(--color-text-primary)] text-right min-w-0 break-words">{r.value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* Officer info (mock store only) */}
          {detail?.officer && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <DashboardCard className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={14} style={{ color: "#14b8a6" }} />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Sub-District Officer</h3>
                </div>
                <div className="flex flex-col divide-y divide-[var(--color-border)]">
                  {[
                    { label: "Officer",     value: detail.officer.name },
                    { label: "Assigned",    value: detail.officer.assignedDate },
                    { label: "Supervisor",  value: detail.officer.supervisor },
                    { label: "SLA Risk",    value: detail.officer.slaRisk },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                      <span className="text-[11px] text-[var(--color-text-muted)]">{r.label}</span>
                      <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{r.value}</span>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </motion.div>
          )}
        </div>
      </div>

      {/* Escalate to Super Admin dialog */}
      <AnimatePresence>
        {superEscOpen && (
          <EscalateToSuperAdminDialog
            complaintId={id}
            ticketNumber={ticketNumber}
            severity={severity}
            description={description}
            address={address}
            onClose={() => setSuperEscOpen(false)}
            onDone={(newId) => {
              setSuperEscOpen(false);
              setSuperEscId(newId);
              showToast(`Escalated to Super Admin as ${newId}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
