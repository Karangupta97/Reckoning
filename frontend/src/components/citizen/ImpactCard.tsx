"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Share2, CheckCircle2, MapPin, Camera, IndianRupee, Calendar, X, Check } from "lucide-react";
import { toPng } from "html-to-image";
import { useComplaintStore } from "@/store/complaintStore";
import { useEscalationStore } from "@/store/escalationStore";
import { useBudgetApprovalStore } from "@/store/budgetApprovalStore";
import { useComplaintWorkflowStore } from "@/store/complaintWorkflowStore";

interface ImpactData {
  id: string;
  title: string;
  location: string;
  category: string;
  status: string;
  fundsApproved: string;
  fundsReleased: string;
  resolutionDate: string;
  beforePhotos: number;
  afterPhotos: number;
}

function useImpactData(complaintId: string): ImpactData | null {
  const complaint = useComplaintStore((s) => s.complaints.find((c) => c.id === complaintId));
  const escalations = useEscalationStore((s) => s.escalations);
  const budgets = useBudgetApprovalStore((s) => s.requests);
  const resolutions = useComplaintWorkflowStore((s) => s.resolutions);

  if (!complaint) return null;

  const esc = escalations.find((e) => e.sourceComplaintId === complaintId || e.id === complaint.escalationId);
  const bud = esc ? budgets.find((b) => b.linkedEscalationIds?.includes(esc.id)) : undefined;
  const res = resolutions.find((r) => r.complaintId === complaintId);

  return {
    id: complaint.id,
    title: complaint.title,
    location: complaint.location,
    category: complaint.category,
    status: complaint.status,
    fundsApproved: bud?.approvedAmount ? `₹${bud.approvedAmount} Cr` : "—",
    fundsReleased: bud?.releasedAmount ? `₹${bud.releasedAmount} Cr` : "—",
    resolutionDate: res?.completionDate ?? complaint.updatedDate,
    beforePhotos: res?.beforePhotos?.length ?? 0,
    afterPhotos: res?.afterPhotos?.length ?? 0,
  };
}

/**
 * ImpactCard — Generates a shareable governance impact card as PNG.
 * Shows complaint resolution proof with funds and evidence summary.
 */
export function ImpactCard({ complaintId, onClose }: { complaintId: string; onClose?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const data = useImpactData(complaintId);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleDownloadPng = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `reckoning-impact-${complaintId}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Impact card downloaded");
    } catch {
      showToast("Download failed — try again");
    }
    setDownloading(false);
  }, [complaintId]);

  const handleCopySummary = useCallback(() => {
    if (!data) return;
    const summary = [
      `✅ RECKONING — Governance Impact`,
      ``,
      `Complaint: ${data.id}`,
      `Issue: ${data.title}`,
      `Location: ${data.location}`,
      `Category: ${data.category}`,
      ``,
      `Funds Approved: ${data.fundsApproved}`,
      `Funds Released: ${data.fundsReleased}`,
      `Resolution Date: ${data.resolutionDate}`,
      `Before Photos: ${data.beforePhotos}`,
      `After Photos: ${data.afterPhotos}`,
      `Status: ${data.status}`,
      ``,
      `— Reckoning Platform`,
    ].join("\n");
    navigator.clipboard.writeText(summary).then(() => showToast("Summary copied to clipboard"));
  }, [data]);

  const handleShare = useCallback(() => {
    if (!data) return;
    const text = `${data.id} — ${data.title} resolved! Funds: ${data.fundsReleased}. #Reckoning`;
    if (navigator.share) {
      navigator.share({ title: `Impact: ${data.id}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => showToast("Shared text copied"));
    }
  }, [data]);

  if (!data) return null;

  const isResolved = data.status === "Resolved";

  return (
    <div className="flex flex-col gap-4">
      {/* The card itself — this is what gets exported as PNG */}
      <div ref={cardRef} className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", width: "100%", maxWidth: "400px" }}>
        {/* Header brand */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">R</span>
            </div>
            <span className="text-white text-xs font-bold tracking-wide">RECKONING</span>
          </div>
          {isResolved && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              <CheckCircle2 size={10} /> Resolved
            </span>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-5 flex flex-col gap-3">
          {/* ID + Category */}
          <div>
            <span className="text-blue-400 text-[10px] font-mono font-bold">{data.id}</span>
            <span className="text-slate-400 text-[10px] ml-2">{data.category}</span>
          </div>

          {/* Title */}
          <h3 className="text-white text-sm font-bold leading-snug">{data.title}</h3>

          {/* Location */}
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="text-slate-400" />
            <span className="text-slate-300 text-[11px]">{data.location}</span>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <IndianRupee size={10} className="text-emerald-400" />
                <span className="text-[9px] text-slate-400">Approved</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">{data.fundsApproved}</span>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <IndianRupee size={10} className="text-amber-400" />
                <span className="text-[9px] text-slate-400">Released</span>
              </div>
              <span className="text-xs font-bold text-amber-400">{data.fundsReleased}</span>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Camera size={10} className="text-purple-400" />
                <span className="text-[9px] text-slate-400">Evidence</span>
              </div>
              <span className="text-xs font-bold text-purple-400">{data.beforePhotos + data.afterPhotos} photos</span>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Calendar size={10} className="text-cyan-400" />
                <span className="text-[9px] text-slate-400">Resolved</span>
              </div>
              <span className="text-xs font-bold text-cyan-400">{data.resolutionDate.split(",")[0] ?? "—"}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
            <span className="text-[9px] text-slate-500">Roads that report themselves™</span>
            <span className="text-[9px] text-slate-500">reckoning.gov.in</span>
          </div>
        </div>
      </div>

      {/* Actions — outside the card (not included in PNG) */}
      <div className="flex items-center gap-2 flex-wrap">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          onClick={handleDownloadPng} disabled={downloading}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg border text-xs font-medium transition-all disabled:opacity-50"
          style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
          <Download size={13} /> {downloading ? "Generating…" : "Download PNG"}
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          onClick={handleCopySummary}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg border text-xs font-medium"
          style={{ borderColor: "rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)", color: "#14b8a6" }}>
          <Copy size={13} /> Copy Summary
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          onClick={handleShare}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg border text-xs font-medium"
          style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa" }}>
          <Share2 size={13} /> Share
        </motion.button>
        {onClose && (
          <button onClick={onClose} className="ml-auto flex items-center gap-1 h-9 px-3 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <X size={13} /> Close
          </button>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium"
            style={{ background: "var(--color-card)", borderColor: "rgba(20,184,166,0.35)", color: "#14b8a6" }}>
            <Check size={14} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
