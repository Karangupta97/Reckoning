/**
 * Reckoning AI module — TypeScript contracts for the Reckoning integration.
 *
 * All interfaces consumed by the AI service, controller, and worker are
 * defined here. Enum types are sourced from the generated Prisma client to
 * guarantee database alignment.
 */

import type { IssueCategory, SeverityLevel } from "@prisma/client";

// ─── Reckoning API Response Shapes ─────────────────────────────────────────────

/** Pixel-coordinate bounding box for a single detection. */
export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A single object detected by the Reckoning model. */
export interface ReckoningDetection {
  /** Raw label string returned by the YOLO model (e.g. "pothole"). */
  rawLabel: string;
  /** Mapped Reckoning issue category. */
  category: IssueCategory;
  /** Mapped Reckoning severity level. */
  severity: SeverityLevel;
  /** Detection confidence score, 0.0 – 1.0. */
  confidence: number;
  /** Bounding box in image pixel coordinates. */
  bbox: BoundingBox;
}

/** Annotated image returned by the Reckoning HuggingFace Space after detection. */
export interface AnnotatedImagePayload {
  /** Base64-encoded image data (e.g. "data:image/jpeg;base64,..."). */
  base64: string;
  /** MIME type of the annotated image (e.g. "image/jpeg"). */
  mimeType: string;
}

/** Raw JSON payload returned by the Reckoning HuggingFace Space `/detect` endpoint. */
export interface ReckoningResponse {
  success: boolean;
  totalDetected: number;
  inferenceMs: number;
  primary: ReckoningDetection | null;
  detections: ReckoningDetection[];
  imageSize: { width: number; height: number };
  model: string;
  /** Annotated result image with bounding boxes drawn — null when no detections. */
  annotatedImage: AnnotatedImagePayload | null;
}

// ─── Processed Result ────────────────────────────────────────────────────────

/** Fully-processed AI detection result ready for persistence / response. */
export interface AIDetectionResult {
  /** Complete raw response from Reckoning (stored as JSON for debugging). */
  raw: ReckoningResponse;
  /** Best-guess category from the primary detection. */
  suggestedCategory: IssueCategory | null;
  /** Best-guess severity from the primary detection. */
  suggestedSeverity: SeverityLevel | null;
  /** Confidence of the primary detection (0.0 – 1.0). */
  confidence: number | null;
  /** Unique categories across all qualifying detections. */
  allIssues: string[];
  /** Timestamp when inference completed. */
  processedAt: Date;
  /** Model identifier returned by Reckoning (e.g. "yolov8n-roaddefects-v2"). */
  modelVersion: string;
  /** Presigned S3 URL for the annotated result image (24h expiry). */
  annotatedImageUrl: string | null;
  /** S3 key for the annotated result image (permanent storage). */
  annotatedS3Key: string | null;
}

// ─── Detection Map Entry ─────────────────────────────────────────────────────

/** Mapping from a raw Reckoning label to Reckoning enums. */
export interface DetectionMapping {
  category: IssueCategory;
  severity: SeverityLevel;
}
