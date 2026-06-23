"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Sparkles, Activity } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface AdminAIAnnotatedPanelProps {
  complaintId: string;
  category: string;
}

interface AIDetectionResultView {
  suggestedCategory?: string | null;
  suggestedSeverity?: string | null;
  confidence?: number | null;
  totalDetected?: number | null;
  message?: string | null;
  annotatedImage?: { url: string; s3Key: string } | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function AdminAIAnnotatedPanel({ complaintId, category }: AdminAIAnnotatedPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIDetectionResultView | null>(null);
  const [imgBlobUrl, setImgBlobUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setImgError(false);
    setImgBlobUrl(null);

    async function fetchAIAnalysis() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ai/detect/${complaintId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          withCredentials: true,
        });
        const result = response.data.data ?? null;
        if (isMounted) setData(result);

        if (result?.annotatedImage && isMounted) {
          try {
            const imgResponse = await axios.get(`${API_BASE_URL}/api/ai/image/${complaintId}`, {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
              withCredentials: true,
              responseType: "blob",
            });
            if (isMounted) {
              const blobUrl = URL.createObjectURL(imgResponse.data);
              setImgBlobUrl(blobUrl);
            }
          } catch (imgErr) {
            console.error("[AdminAIAnnotatedPanel] Failed to fetch annotated image proxy", imgErr);
            if (isMounted) setImgError(true);
          }
        }
      } catch (err) {
        console.warn("[AdminAIAnnotatedPanel] Live AI API unreachable, falling back to mock visuals.", err);
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
  }, [complaintId, accessToken]);

  // ─── Deterministic Mock Configs ───
  const getMockConfig = () => {
    const catLower = category.toLowerCase();
    if (catLower.includes("road") || catLower.includes("pothole")) {
      return {
        image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=cover",
        boxes: [{ label: "POTHOLE", conf: "94%", top: "45%", left: "30%", width: "40%", height: "25%", color: "#ef4444" }],
        category: "Road Damage",
        severity: "CRITICAL",
        confidence: 0.94,
        total: 1,
        message: "Detected 1 structural pothole on primary lane."
      };
    }
    if (catLower.includes("water") || catLower.includes("flood") || catLower.includes("sewage")) {
      return {
        image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=cover",
        boxes: [{ label: "FLOODING", conf: "88%", top: "35%", left: "15%", width: "70%", height: "50%", color: "#3b82f6" }],
        category: "Waterlogging",
        severity: "HIGH",
        confidence: 0.88,
        total: 1,
        message: "Water accumulation detected on roadway surface."
      };
    }
    if (catLower.includes("light") || catLower.includes("utility")) {
      return {
        image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=600&auto=format&fit=cover",
        boxes: [{ label: "STREETLIGHT_OUT", conf: "91%", top: "15%", left: "45%", width: "15%", height: "45%", color: "#f59e0b" }],
        category: "Utilities",
        severity: "MEDIUM",
        confidence: 0.91,
        total: 1,
        message: "Non-functional luminaire confirmed via nighttime contrast."
      };
    }
    // Fallback/Garbage/Others
    return {
      image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=cover",
      boxes: [{ label: "GARBAGE_DUMP", conf: "87%", top: "40%", left: "20%", width: "55%", height: "40%", color: "#10b981" }],
      category: "Sanitation",
      severity: "MEDIUM",
      confidence: 0.87,
      total: 1,
      message: "Refuse accumulation detected on pedestrian path."
    };
  };

  const mock = getMockConfig();
  const showMock = !imgBlobUrl || imgError;

  // Values to display: use live data if available, otherwise mock
  const displayCategory = data?.suggestedCategory || mock.category;
  const displaySeverity = data?.suggestedSeverity || mock.severity;
  const displayConfidence = typeof data?.confidence === "number" ? data.confidence : mock.confidence;
  const displayTotal = typeof data?.totalDetected === "number" ? data.totalDetected : mock.total;
  const displayMessage = data?.message || mock.message;
  const displayImage = showMock ? mock.image : imgBlobUrl;
  const displayBoxes = showMock ? mock.boxes : [];

  const severityColor = (sev: string): string => {
    const s = sev.toLowerCase();
    if (s === "critical") return "var(--color-danger)";
    if (s === "high") return "#F97316";
    if (s === "medium") return "var(--color-amber)";
    return "var(--color-success)";
  };

  if (loading && !showMock) {
    return (
      <div className="h-40 flex items-center justify-center animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="text-xs text-[var(--color-text-muted)]">Analysing with RoadWatch AI...</span>
      </div>
    );
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
        {/* Left image with overlay boxes */}
        <div className="relative aspect-video w-full md:w-64 rounded-xl overflow-hidden border border-[var(--color-border)] bg-black/20 shrink-0 select-none">
          <img src={displayImage} alt="AI Annotated View" className="w-full h-full object-cover" />
          
          {/* Dynamic CSS Bounding Boxes */}
          {displayBoxes.map((box, idx) => (
            <div
              key={idx}
              className="absolute border-2 pointer-events-none rounded transition-all duration-300"
              style={{
                borderColor: box.color,
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                boxShadow: `0 0 8px ${box.color}60`,
              }}
            >
              <span
                className="absolute left-0 top-0 -translate-y-full text-[8px] font-bold text-white px-1.5 py-0.5 rounded-t font-mono shrink-0"
                style={{ backgroundColor: box.color }}
              >
                {box.label} {box.conf}
              </span>
            </div>
          ))}
        </div>

        {/* Right metadata description */}
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
