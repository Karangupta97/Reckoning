"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import type { MyReport } from "./types";
import { useAuthStore } from "@/stores/authStore";

/** Shape returned by the AI detection endpoint */
interface AIDetectionResultView {
  suggestedCategory?: string | null;
  suggestedSeverity?: string | null;
  confidence?: number | null;
  totalDetected?: number | null;
  message?: string | null;
  annotatedImage?: { url: string; expiresIn: number; s3Key: string } | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function apiUrl(path: string): string {
  return `${API_BASE_URL}/api${path}`;
}

interface AIAnnotatedPanelProps {
  report: MyReport;
}

/**
 * Lazy loads AI analysis details for a specific report upon card expansion.
 * Calls `GET /api/ai/detect/:complaintId` via `withMockFallback`.
 *
 * Data path: response → unwrapData<AIDetectionResultView> → data.annotatedImage.url
 * The nested shape is { annotatedImage: { url: string, expiresIn: number, s3Key: string } | null }
 */
export function AIAnnotatedPanel({ report }: AIAnnotatedPanelProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Fetch state
  const [fetchLoading, setFetchLoading] = useState(true);
  const [data, setData] = useState<AIDetectionResultView | null>(null);

  // Image load state — tracks whether the <img> itself has loaded or errored
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgBlobUrl, setImgBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setFetchLoading(true);
    setImgLoaded(false);
    setImgError(false);
    setImgBlobUrl(null);

    async function fetchAIAnalysis() {
      try {
        const response = await axios.get(apiUrl(`/ai/detect/${report.id}`), {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
          withCredentials: true,
        });
        console.log("AI result:", response.data);
        const result = response.data.data ?? null;
        if (isMounted) {
          setData(result);
        }

        // If AI data has an annotated image, fetch it via proxy as a blob.
        if (result?.annotatedImage && isMounted) {
          try {
            const imgResponse = await axios.get(apiUrl(`/ai/image/${report.id}`), {
              headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : undefined,
              withCredentials: true,
              responseType: "blob",
            });
            if (isMounted) {
              const blobUrl = URL.createObjectURL(imgResponse.data);
              setImgBlobUrl(blobUrl);
            }
          } catch (imgErr) {
            console.error("[AIAnnotatedPanel] Failed to fetch annotated image via proxy", imgErr);
            if (isMounted) setImgError(true);
          }
        }
      } catch (err) {
        console.error("[AIAnnotatedPanel] Failed to fetch AI analysis", err);
        if (isMounted) setData(null);
      } finally {
        if (isMounted) setFetchLoading(false);
      }
    }

    void fetchAIAnalysis();

    return () => {
      isMounted = false;
      // Revoke blob URL on cleanup to free memory.
      setImgBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [report.id, accessToken]);

  // ─── Severity colour helper ────────────────────────────────────────────────
  const severityColor = (sev: string | null): string => {
    const s = String(sev ?? "medium").toLowerCase();
    if (s === "critical") return "var(--color-danger)";
    if (s === "high") return "#F97316";
    if (s === "medium") return "var(--color-amber)";
    return "var(--color-success)";
  };

  const formatCategory = (cat: string | null): string => {
    if (!cat) return "";
    return cat.replace(/_/g, " ").toLowerCase();
  };

  // ─── Fetch skeleton shimmer ────────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <div className="mt-3 space-y-2 animate-pulse">
        <div className="h-3 w-24 rounded" style={{ backgroundColor: "var(--color-border)" }} />
        <div className="flex flex-col sm:flex-row gap-4">
          <div
            className="w-full max-w-sm h-48 rounded-xl"
            style={{ backgroundColor: "var(--color-border)" }}
          />
          <div className="flex-1 space-y-2 py-2">
            <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--color-border)" }} />
            <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--color-border)" }} />
            <div className="h-3 w-40 rounded" style={{ backgroundColor: "var(--color-border)" }} />
          </div>
        </div>
      </div>
    );
  }

  // Use the blob URL fetched via authenticated proxy (bypasses S3 CORS).
  const imageUrl = imgBlobUrl;

  // Show placeholder when: no url, or image errored after load attempt
  const showPlaceholder = !imageUrl || imgError;

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
      {/* Section label: ✦ AI Analysis amber small caps */}
      <p
        className="text-[0.65rem] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
        style={{ color: "var(--color-amber)" }}
      >
        ✦ AI Analysis
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* ── Left: Annotated S3 image or muted placeholder ── */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          {showPlaceholder ? (
            <div
              className="w-full max-w-sm min-h-[160px] rounded-xl flex items-center justify-center border border-dashed text-xs"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-muted)",
              }}
            >
              AI analysis unavailable
            </div>
          ) : (
            <div
              className="relative w-full max-w-sm min-h-[160px] rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              {/* Shimmer while image bytes are loading (fetch done, img pending) */}
              {!imgLoaded && (
                <div
                  className="absolute inset-0 animate-pulse rounded-xl"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
              )}
              <img
                src={imageUrl}
                alt="AI annotated evidence with YOLOv8 bounding boxes"
                className="w-full max-w-sm rounded-xl object-cover border"
                style={{
                  maxHeight: 280,
                  borderColor: "var(--color-border)",
                  // keep space while shimmer shows; hide broken state until we handle it
                  display: "block",
                  opacity: imgLoaded ? 1 : 0,
                  transition: "opacity 0.2s ease",
                }}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  setImgError(true);
                  setImgLoaded(false);
                }}
              />
            </div>
          )}
        </div>

        {/* ── Right: Detection metadata stacked vertically ── */}
        <div className="flex-1 flex flex-col gap-2.5 py-1 justify-center">
          {/* suggestedCategory chip + suggestedSeverity chip colored by level */}
          <div className="flex items-center gap-2 flex-wrap">
            {data?.suggestedCategory && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-medium capitalize"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {formatCategory(data.suggestedCategory)}
              </span>
            )}
            {data?.suggestedSeverity && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.65rem] font-semibold capitalize"
                style={{
                  backgroundColor: `color-mix(in srgb, ${severityColor(data.suggestedSeverity)} 12%, transparent)`,
                  color: severityColor(data.suggestedSeverity),
                }}
              >
                {data.suggestedSeverity.toLowerCase()}
              </span>
            )}
          </div>

          {/* confidence as (confidence * 100).toFixed(0)% in DM Mono amber */}
          {typeof data?.confidence === "number" && (
            <div className="text-xs">
              <span style={{ color: "var(--color-text-secondary)" }}>Confidence: </span>
              <span
                className="font-mono font-bold"
                style={{ color: "var(--color-amber)" }}
              >
                {(data.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* totalDetected count muted xs */}
          {typeof data?.totalDetected === "number" && (
            <div className="text-[0.7rem]" style={{ color: "var(--color-text-muted)" }}>
              {data.totalDetected} detection{data.totalDetected !== 1 ? "s" : ""} found
            </div>
          )}

          {/* message muted xs italic */}
          {data?.message && (
            <div className="text-[0.7rem] italic" style={{ color: "var(--color-text-muted)" }}>
              {data.message}
            </div>
          )}

          {/* Fallback note if image URL present but load failed */}
          {imgError && imageUrl && (
            <div className="text-[0.65rem]" style={{ color: "var(--color-text-muted)" }}>
              Annotated image could not be loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
