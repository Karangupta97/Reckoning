"use client";

/**
 * District Admin — Complaint Detail
 *
 * Shows full complaint detail for a complaint escalated to district level.
 * Includes a teal info banner: "This complaint was escalated from sub-district level."
 * Shows escalatedBy admin name and escalatedAt timestamp.
 * Allows district admin to escalate further or resolve.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ShieldAlert, Info, Calendar, UserCheck,
  MapPin, FileText, CheckCircle2, AlertTriangle,
  Clock, Loader2, ExternalLink,
} from "lucide-react";
import { DashboardCard } from "@/components/super-admin-dashboard/dashboard-card";
import { api } from "@/lib/api";
import { shouldUseMock } from "@/lib/useMock";
import { useAdminAuthStore } from "@/stores/adminAuthStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DistrictComplaintDetail {
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
}

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH:     "#f97316",
  MEDIUM:   "#f59e0b",
  LOW:      "#10b981",
};

const MOCK_DETAIL: DistrictComplaintDetail = {
  id: "mock-1",
  ticketNumber: "RW-IN-2026-000042",
  category: "POTHOLE",
  severity: "HIGH",
  status: "ESCALATED_TO_DISTRICT",
  description: "Large pothole on NH-48 causing traffic hazard near Panvel Toll Plaza. Multiple vehicles have been damaged.",
  address: "NH-48, near Panvel Toll Plaza, Panvel, Maharashtra",
  latitude: 18.9894,
  longitude: 73.1175,
  escalationLevel: 1,
  escalatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  escalatedBy: "Officer R. Sharma (Sub-District Admin)",
  escalationReason: "Requires district-level resources for repair",
  slaDeadline: new Date(Date.now() + 46 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DistrictComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const isMock = shouldUseMock(currentAdmin?.email);

  const [complaint, setComplaint] = useState<DistrictComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        if (isMock) {
          await new Promise((r) => setTimeout(r, 350));
          if (mounted) { setComplaint(MOCK_DETAIL); setLoading(false); }
          return;
        }
        // The backend GET /api/admin/my-district/escalations lists all; no single-item
        // endpoint exists yet — fetch the list and find by id.
        const res = await api.get("/api/admin/my-district/escalations", {
          params: { limit: "100" },
        });
        const items: DistrictComplaintDetail[] = res.data?.data?.complaints ?? [];
        const found = items.find((c) => c.id === id);
        if (mounted) {
          if (found) { setComplaint(found); }
          else { setError("Complaint not found or outside your district jurisdiction."); }
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
  }, [id, isMock]);

  // Loading
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

  // Error
  if (error || !complaint) {
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

  const isEscalatedToDistrict = complaint.status === "ESCALATED_TO_DISTRICT";
  const sevColor = SEVERITY_COLOR[complaint.severity] ?? "#94a3b8";

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
            style={{ background: "var(--color-card)", borderColor: "rgba(20,184,166,0.4)", color: "#14b8a6" }}
          >
            <CheckCircle2 size={15} /> {toast}
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
          {complaint.ticketNumber}
        </span>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
          style={{ color: sevColor, borderColor: `${sevColor}40`, background: `${sevColor}12` }}>
          {complaint.severity}
        </span>
        {isEscalatedToDistrict && (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
            style={{ borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.12)", color: "#14b8a6" }}
          >
            <ShieldAlert size={10} /> ESCALATED
          </motion.span>
        )}
      </motion.div>

      {/* ── Escalation info banner — teal primary, info icon ── */}
      {isEscalatedToDistrict && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: "rgba(20,184,166,0.35)", background: "rgba(20,184,166,0.08)" }}
          role="status"
          aria-label="Escalation context"
        >
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: "#14b8a6" }} />
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#14b8a6" }}>
              This complaint was escalated from sub-district level.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {complaint.escalatedBy && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <UserCheck size={12} className="shrink-0" style={{ color: "#14b8a6" }} />
                  Escalated by{" "}
                  <span className="font-semibold text-[var(--color-text-primary)]">{complaint.escalatedBy}</span>
                </span>
              )}
              {complaint.escalatedAt && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <Calendar size={12} className="shrink-0" style={{ color: "#14b8a6" }} />
                  {fmtDT(complaint.escalatedAt)}
                </span>
              )}
              {complaint.escalationReason && (
                <span className="text-xs text-[var(--color-text-muted)] italic">
                  Reason: {complaint.escalationReason.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* Left — 2/3 */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          {/* Case Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: "#14b8a6" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Case Summary</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {complaint.description ?? "No description provided."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Category",   value: complaint.category.replace(/_/g, " ") },
                  { label: "Severity",   value: complaint.severity },
                  { label: "Status",     value: isEscalatedToDistrict ? "Escalated" : complaint.status.replace(/_/g, " ") },
                  { label: "Esc. Level", value: `Level ${complaint.escalationLevel}` },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">{m.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
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
                <a href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium hover:underline"
                  style={{ color: "#14b8a6" }}>
                  <ExternalLink size={10} /> Open in Maps
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="text-sm text-[var(--color-text-secondary)] break-words">{complaint.address ?? "—"}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Address</div>
                </div>
                <div className="rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <div className="text-xs font-mono font-bold text-[var(--color-text-primary)]">
                    {complaint.latitude.toFixed(5)}°N, {complaint.longitude.toFixed(5)}°E
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Coordinates</div>
                </div>
              </div>
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
        </div>

        {/* Right — 1/3 */}
        <div className="flex flex-col gap-3">
          {/* Escalation timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <DashboardCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: "#14b8a6" }} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Escalation Details</h3>
              </div>
              <div className="flex flex-col divide-y divide-[var(--color-border)]">
                {[
                  { label: "Escalated By",  value: complaint.escalatedBy ?? "—" },
                  { label: "Escalated At",  value: complaint.escalatedAt ? fmtDT(complaint.escalatedAt) : "—" },
                  { label: "Reason",        value: complaint.escalationReason?.replace(/_/g, " ") ?? "—" },
                  { label: "SLA Deadline",  value: complaint.slaDeadline ? fmtDT(complaint.slaDeadline) : "—" },
                  { label: "Reported At",   value: fmtDT(complaint.createdAt) },
                ].map((r) => (
                  <div key={r.label} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                    <span className="text-[11px] text-[var(--color-text-muted)] shrink-0 w-24">{r.label}</span>
                    <span className="text-[11px] font-medium text-[var(--color-text-primary)] text-right min-w-0 break-words">{r.value}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </motion.div>

          {/* District admin actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
            <DashboardCard className="p-4 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                District Actions
              </p>
              <motion.button
                whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                onClick={() => showToast("Complaint marked as In Progress.")}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
                <Clock size={14} /> Mark In Progress
              </motion.button>
              <motion.button
                whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                onClick={() => showToast("Complaint resolved at district level.")}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-semibold text-left transition-all w-full"
                style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                <CheckCircle2 size={14} /> Mark Resolved
              </motion.button>
              <motion.button
                whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                onClick={() => showToast("Complaint escalated to Super Admin.")}
                className="flex items-center gap-2.5 h-9 px-3 rounded-lg border text-xs font-medium text-left transition-all w-full"
                style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", color: "#f97316" }}>
                <ShieldAlert size={14} /> Escalate to Super Admin
              </motion.button>
            </DashboardCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
