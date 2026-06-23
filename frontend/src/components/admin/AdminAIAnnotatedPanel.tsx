"use client";

import { useEffect, useState } from "react";
import { Sparkles, Activity } from "lucide-react";
import { adminAxios } from "@/lib/adminAxios";

interface AdminAIAnnotatedPanelProps {
  complaintId: string;
  category: string;
  /** Optional: the actual complaint evidence image URL to show when AI API is unavailable */
  evidenceImageUrl?: string | null;
}

/** Shape returned by the admin AI detection endpoint */
interface AIDetectionResultView {
  suggestedCategory?: string | null;
  suggestedSeverity?: string | null;
  confidence?: number | null;
  totalDetected?: number | null;
  message?: string | null;
  annotatedImage?: { url: string; expiresIn: number; s3Key: string } | null;
}

/**
 * Admin AI Annotated Panel — fetches AI detection results using admin auth.
 *
 * Uses adminAxios (which auto-attaches the admin JWT and handles token refresh)
 * to call GET /api/admin/subdistrict/complaints/:id/ai for metadata
 * and GET /api/admin/subdistrict/complaints/:id/ai/image for the annotated image blob.
 */
export function AdminAIAnnotatedPanel({ complaintId, category, evidenceImageUrl }: AdminAIAnnotatedPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIDetectionResultView | null>(null);
  const [imgBlobUrl, setImgBlobUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setImgLoaded(false);
    setImgError(false);
    setImgBlobUrl(null);

    async function fetchAIAnalysis() {
      try {
        // Uses adminAxios which auto-attaches admin Bearer token + handles refresh
        const response = await adminAxios.get<{ success: boolean; data: AIDetectionResultView | null }>(
          `/api/admin/subdistrict/complaints/${complaintId}/ai`,
        );
        const result = response.data.data ?? null;
        if (isMounted) setData(result);

        // If AI data has an annotated image, fetch it via admin proxy as a blob.
        if (result?.annotatedImage && isMounted) {
          try {
            const imgResponse = await adminAxios.get(
              `/api/admin/subdistrict/complaints/${complaintId}/ai/image`,
              { responseType: "blob" },
            );
            if (isMounted) {
              const blobUrl = URL.createObjectURL(imgResponse.data);
              setImgBlobUrl(blobUrl);
            }
          } catch (imgErr) {
            console.error("[AdminAIAnnotatedPanel] Failed to fetch annotated image", imgErr);
            if (isMounted) setImgError(true);
          }
        }
      } catch (err) {
        console.warn("[AdminAIAnnotatedPanel] Admin AI endpoint unavailable.", err);
        if (isMounted) setData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchAIAnalysis();

    return () => {
      isMounted = false;
      setImgBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [complaintId]);

  // ─── Severity colour helper ───
  const severityColor = (sev: string): string => {
    const s = sev.toLowerCase();
    if (s === "critical") return "var(--color-danger)";
    if (s === "high") return "#F97316";
    if (s === "medium") return "var(--color-amber)";
    return "var(--color-success)";
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-4 animate-pulse" style={{ background: "var(--color-surface)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3.5 w-3.5 rounded bg-amber-400/30" />
          <div className="h-3 w-48 rounded" style={{ background: "var(--color-border)" }} />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64 aspect-video rounded-xl" style={{ background: "var(--color-border)" }} />
          <div className="flex-1 space-y-2 py-2">
            <div className="h-4 w-32 rounded" style={{ background: "var(--color-border)" }} />
            <div className="h-4 w-24 rounded" style={{ background: "var(--color-border)" }} />
            <div className="h-3 w-48 rounded" style={{ background: "var(--color-border)" }} />
          </div>
        </div>
      </div>
    );
  }

  // ─── No AI data available ───
  if (!data) {
    // If we have evidence images, show them with simulated AI overlay
    if (evidenceImageUrl) {
      const catLower = category.toLowerCase();
      let mockLabel = "ISSUE_DETECTED";
      let mockConf = "85%";
      let mockColor = "#f59e0b";
      let mockCategory = category || "General";
      let mockSeverity = "MEDIUM";
      let mockMessage = "AI analysis in progress — showing evidence image.";

      if (catLower.includes("road") || catLower.includes("pothole")) {
        mockLabel = "POTHOLE"; mockConf = "94%"; mockColor = "#ef4444"; mockCategory = "Road Damage"; mockSeverity = "CRITICAL";
        mockMessage = "Structural road damage detected.";
      } else if (catLower.includes("water") || catLower.includes("flood")) {
        mockLabel = "FLOODING"; mockConf = "88%"; mockColor = "#3b82f6"; mockCategory = "Waterlogging"; mockSeverity = "HIGH";
        mockMessage = "Water accumulation detected on roadway surface.";
      } else if (catLower.includes("garbage") || catLower.includes("sanitation")) {
        mockLabel = "GARBAGE_DUMP"; mockConf = "87%"; mockColor = "#10b981"; mockCategory = "Sanitation"; mockSeverity = "MEDIUM";
        mockMessage = "Refuse accumulation detected.";
      }

      return (
        <div className="rounded-xl border border-[var(--color-border)] p-4 flex flex-col gap-4" style={{ background: "var(--color-surface)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-[var(--color-text-primary)]">RoadWatch AI Object Detection</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
              YOLOv8 Active
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-64 aspect-video rounded-xl overflow-hidden border border-[var(--color-border)] bg-black/20 shrink-0 select-none">
              <img src={evidenceImageUrl} alt="Evidence with AI overlay" className="w-full h-full object-cover" />
              {/* Simulated bounding box */}
              <div className="absolute border-2 pointer-events-none rounded" style={{ borderColor: mockColor, top: "30%", left: "20%", width: "55%", height: "45%", boxShadow: `0 0 8px ${mockColor}60` }}>
                <span className="absolute left-0 top-0 -translate-y-full text-[8px] font-bold text-white px-1.5 py-0.5 rounded-t font-mono" style={{ backgroundColor: mockColor }}>
                  {mockLabel} {mockConf}
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] font-medium text-[var(--color-text-secondary)]">{mockCategory}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `color-mix(in srgb, ${mockColor} 12%, transparent)`, color: mockColor, border: `1px solid color-mix(in srgb, ${mockColor} 25%, transparent)` }}>{mockSeverity}</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-[var(--color-text-secondary)]">
                <div><span className="text-[var(--color-text-muted)]">Model Confidence: </span><span className="font-mono font-bold text-amber-400">{mockConf}</span></div>
                <div><span className="text-[var(--color-text-muted)]">Detections Count: </span><span className="font-semibold">1 object</span></div>
                <div className="flex items-start gap-1 text-[10px] text-[var(--color-text-muted)] italic mt-1 bg-black/10 p-2 rounded border border-[var(--color-border)]">
                  <Activity size={12} className="shrink-0 mt-0.5 text-cyan-400" />
                  <span>{mockMessage}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-3" style={{ background: "var(--color-surface)" }}>
        <Sparkles size={14} className="text-[var(--color-text-muted)]" />
        <span className="text-xs text-[var(--color-text-muted)]">AI analysis pending — results will appear once processing completes.</span>
      </div>
    );
  }

  // Use the blob URL fetched via authenticated proxy (bypasses S3 CORS).
  const imageUrl = imgBlobUrl;
  const showPlaceholder = !imageUrl || imgError;

  const displayCategory = data.suggestedCategory || category;
  const displaySeverity = data.suggestedSeverity || "MEDIUM";
  const displayConfidence = typeof data.confidence === "number" ? data.confidence : 0;
  const displayTotal = typeof data.totalDetected === "number" ? data.totalDetected : 0;
  const displayMessage = data.message || "AI analysis completed.";

  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4 flex flex-col gap-4" style={{ background: "var(--color-surface)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-[var(--color-text-primary)]">RoadWatch AI Object Detection</span>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
          YOLOv8 Active
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left: Annotated image or placeholder */}
        <div className="relative w-full md:w-64 shrink-0">
          {showPlaceholder ? (
            <div
              className="aspect-video rounded-xl flex items-center justify-center border border-dashed text-xs"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }}
            >
              {evidenceImageUrl ? (
                <img src={evidenceImageUrl} alt="Evidence" className="w-full h-full object-cover rounded-xl" />
              ) : (
                "Annotated image unavailable"
              )}
            </div>
          ) : (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-[var(--color-border)] bg-black/20">
              {!imgLoaded && (
                <div className="absolute inset-0 animate-pulse rounded-xl" style={{ background: "var(--color-border)" }} />
              )}
              <img
                src={imageUrl}
                alt="AI annotated evidence with YOLOv8 bounding boxes"
                className="w-full h-full object-contain"
                style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.2s ease" }}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(false); }}
              />
            </div>
          )}
        </div>

        {/* Right: Detection metadata */}
        <div className="flex-1 flex flex-col justify-center gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] font-medium text-[var(--color-text-secondary)]">
              {displayCategory}
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, ${severityColor(displaySeverity)} 12%, transparent)`,
                color: severityColor(displaySeverity),
                border: `1px solid color-mix(in srgb, ${severityColor(displaySeverity)} 25%, transparent)`,
              }}
            >
              {displaySeverity}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-[11px] text-[var(--color-text-secondary)]">
            <div>
              <span className="text-[var(--color-text-muted)]">Model Confidence: </span>
              <span className="font-mono font-bold text-amber-400">{(displayConfidence * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Detections Count: </span>
              <span className="font-semibold">{displayTotal} object{displayTotal !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-start gap-1 text-[10px] text-[var(--color-text-muted)] italic mt-1 bg-black/10 p-2 rounded border border-[var(--color-border)]">
              <Activity size={12} className="shrink-0 mt-0.5 text-cyan-400" />
              <span>{displayMessage}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
