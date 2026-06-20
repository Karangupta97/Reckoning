/**
 * Reckoning AI service — Reckoning (YOLOv8) integration.
 *
 * Communicates with the Reckoning road-defect detection model hosted on
 * HuggingFace Spaces. The service is designed for graceful degradation:
 * detection failures NEVER block complaint submission — they return `null`.
 *
 * @module ai.service
 */

import { randomUUID } from "node:crypto";
import axios from "axios";
import FormData from "form-data";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { putObject } from "../../services/s3.service.js";
import { getSignedDownloadUrl } from "../../config/s3.js";
import type {
  AIDetectionResult,
  AnnotatedImagePayload,
  DetectionMapping,
  ReckoningDetection,
  ReckoningResponse,
} from "./ai.types.js";
import type { IssueCategory, SeverityLevel } from "@prisma/client";

// ─── Detection Label → Reckoning Enum Map ────────────────────────────────────
// Update this object when Reckoning is retrained with new labels.

const DETECTION_MAP: Record<string, DetectionMapping> = {
  pothole:       { category: "POTHOLE",                  severity: "HIGH"   },
  crack:         { category: "CRACKS_DAMAGE",            severity: "MEDIUM" },
  faded_marking: { category: "FADED_LANE_MARKINGS",      severity: "LOW"    },
  broken_sign:   { category: "MISSING_BROKEN_SIGNBOARD", severity: "MEDIUM" },
  poor_lighting: { category: "POOR_STREET_LIGHTING",     severity: "MEDIUM" },
  encroachment:  { category: "ENCROACHMENT",             severity: "HIGH"   },
  waterlogging:  { category: "OTHERS",                   severity: "HIGH"   },
  debris:        { category: "OTHERS",                   severity: "MEDIUM" },
};

/** Fallback mapping when a raw label is not recognised. */
const FALLBACK_MAPPING: DetectionMapping = {
  category: "OTHERS" as IssueCategory,
  severity: "LOW" as SeverityLevel,
};

/** Presigned URL lifetime for annotated result images (24 hours). */
const ANNOTATED_IMAGE_EXPIRY_SECONDS = 86400;

/**
 * Map a raw Reckoning detection to a Reckoning-enriched detection.
 *
 * @param raw Raw detection from the Reckoning response.
 * @returns Detection with Reckoning enum mappings applied.
 */
function mapDetection(raw: {
  label?: string;
  rawLabel?: string;
  category?: string;
  severity?: string;
  confidence: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
}): ReckoningDetection {
  const label = raw.rawLabel ?? raw.label ?? "";
  const key = label.toLowerCase().trim();
  const mapping = DETECTION_MAP[key] ?? DETECTION_MAP[label] ?? {
    category: (raw.category as IssueCategory) ?? FALLBACK_MAPPING.category,
    severity: (raw.severity as SeverityLevel) ?? FALLBACK_MAPPING.severity,
  };
  return {
    rawLabel: label,
    category: mapping.category,
    severity: mapping.severity,
    confidence: raw.confidence,
    bbox: raw.bbox,
  };
}

/**
 * Decode a base64-encoded annotated image, upload it to S3, and return the
 * presigned download URL + storage key.
 *
 * @param payload  Base64 image payload from the Reckoning Space.
 * @param userId   Owner's user ID (used in the S3 key path).
 * @returns Object with `url` (presigned) and `s3Key`, or `null` on failure.
 */
async function uploadAnnotatedImage(
  payload: AnnotatedImagePayload,
  userId: string,
): Promise<{ url: string; s3Key: string } | null> {
  try {
    // Strip the data URI prefix if present.
    const base64Data = payload.base64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    if (imageBuffer.length === 0) {
      logger.warn("Annotated image base64 decoded to empty buffer");
      return null;
    }

    // Build deterministic S3 key: ai-results/{userId}/{YYYY}/{MM}/{DD}/{uuid}.jpg
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const s3Key = `ai-results/${userId}/${year}/${month}/${day}/${randomUUID()}.jpg`;

    await putObject(s3Key, imageBuffer, payload.mimeType || "image/jpeg");

    const url = await getSignedDownloadUrl(s3Key, ANNOTATED_IMAGE_EXPIRY_SECONDS);

    logger.info("Annotated image uploaded to S3", {
      s3Key,
      userId,
      bufferSize: imageBuffer.length,
    });
    return { url, s3Key };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.warn(`Failed to upload annotated image: ${message}`);
    return null;
  }
}

/**
 * Send an image buffer to the Reckoning HuggingFace Space for road defect detection.
 *
 * **Never throws** — returns `null` on any failure so the complaint submission
 * flow is never blocked by AI unavailability.
 *
 * @param imageBuffer Raw image bytes (JPEG/PNG/WebP).
 * @param mimeType    MIME type of the image (e.g. "image/jpeg").
 * @param userId      Authenticated user ID (used for S3 annotated image path).
 * @returns Processed detection result, or `null` when inference fails/is unavailable.
 */
export async function runReckoningDetection(
  imageBuffer: Buffer,
  mimeType: string,
  userId: string,
): Promise<AIDetectionResult | null> {
  try {
    const form = new FormData();
    form.append("file", imageBuffer, {
      filename: "image.jpg",
      contentType: mimeType,
    });

    // FIX 1: Use Infinity for content limits + explicit responseType to prevent
    // truncation of large base64 annotated images (can be 300KB–1MB+).
    const response = await axios.post(
      `${env.RECKONING_API_URL}/detect`,
      form,
      {
        headers: {
          "x-api-secret": env.RECKONING_API_SECRET,
          ...form.getHeaders(),
        },
        timeout: env.RECKONING_TIMEOUT_MS,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        responseType: "json",
      },
    );

    const data = response.data as ReckoningResponse;

    // Map all raw detections through the label → enum map.
    const allMapped: ReckoningDetection[] = (data.detections ?? []).map((d: unknown) => {
      const det = d as {
        label?: string;
        rawLabel?: string;
        category?: string;
        severity?: string;
        confidence: number;
        bbox: { x1: number; y1: number; x2: number; y2: number };
      };
      return mapDetection(det);
    });

    // Filter below confidence threshold.
    const threshold = env.RECKONING_CONFIDENCE_THRESHOLD;
    const qualifying = allMapped.filter((d) => d.confidence >= threshold);

    // Sort by confidence descending.
    qualifying.sort((a, b) => b.confidence - a.confidence);

    const primary = qualifying[0] ?? null;

    // ── Upload annotated image to S3 (non-blocking on failure) ────────────
    let annotatedImageUrl: string | null = null;
    let annotatedS3Key: string | null = null;

    // FIX 3: Check for base64 content specifically — not just truthiness of
    // the annotatedImage object (it could be {} or { base64: "" }).
    if (data.annotatedImage?.base64) {
      const uploaded = await uploadAnnotatedImage(data.annotatedImage, userId);
      if (uploaded) {
        annotatedImageUrl = uploaded.url;
        annotatedS3Key = uploaded.s3Key;
        logger.info(`Annotated image stored: ${uploaded.s3Key}`);
      }
    } else {
      logger.warn("Reckoning returned no annotatedImage.base64 — check HF Space app.py");
    }

    // Build enriched response (strip base64 from raw to avoid huge payloads in DB).
    const enrichedResponse: ReckoningResponse = {
      success: data.success,
      totalDetected: qualifying.length,
      inferenceMs: data.inferenceMs,
      primary,
      detections: qualifying,
      imageSize: data.imageSize,
      model: data.model,
      annotatedImage: null, // Never store raw base64 in the result object
    };

    const result: AIDetectionResult = {
      raw: enrichedResponse,
      suggestedCategory: primary?.category ?? null,
      suggestedSeverity: primary?.severity ?? null,
      confidence: primary?.confidence ?? null,
      allIssues: [...new Set(qualifying.map((d) => d.category))],
      processedAt: new Date(),
      modelVersion: data.model ?? "reckoning-unknown",
      annotatedImageUrl,
      annotatedS3Key,
    };

    logger.info("Reckoning detection completed", {
      totalDetected: qualifying.length,
      inferenceMs: data.inferenceMs,
      primaryCategory: primary?.category ?? "none",
      hasAnnotatedImage: annotatedImageUrl !== null,
    });

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.warn(`Reckoning detection failed: ${message}`);
    return null;
  }
}

/**
 * Check if the Reckoning API is reachable.
 *
 * Used for startup health checks and the public `/api/ai/health` endpoint.
 * Never throws.
 *
 * @returns Health status with latency and model info when available.
 */
export async function checkReckoningHealth(): Promise<{
  online: boolean;
  latencyMs: number | null;
  modelInfo: string | null;
}> {
  try {
    const start = Date.now();
    const response = await axios.get<{ model?: string; status?: string }>(
      `${env.RECKONING_API_URL}/health`,
      {
        headers: { "x-api-secret": env.RECKONING_API_SECRET },
        timeout: 5000,
      },
    );
    const latencyMs = Date.now() - start;
    return {
      online: true,
      latencyMs,
      modelInfo: response.data.model ?? null,
    };
  } catch {
    return { online: false, latencyMs: null, modelInfo: null };
  }
}
