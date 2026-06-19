/**
 * Reckoning AI controller — HTTP handlers for the Reckoning integration.
 *
 * Exposes citizen-facing detection, annotated image download, and a public
 * health endpoint.
 */

import type { NextFunction, Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { getFileBuffer } from "../../services/s3.service.js";
import { BUCKET_NAME, s3Client } from "../../config/s3.js";
import { runReckoningDetection, checkReckoningHealth } from "./ai.service.js";
import { detectSchema } from "./ai.validation.js";

/** Presigned URL lifetime for annotated result re-downloads (24 hours). */
const DOWNLOAD_EXPIRY_SECONDS = 86400;

/**
 * POST /api/ai/detect
 *
 * Citizen uploads an image → receives instant AI analysis before filing a
 * complaint. Allows the citizen to review AI suggestions and override them.
 * If the model returns an annotated image, it is stored in S3 and the
 * presigned URL is returned for the citizen to view/download.
 *
 * Auth: requireAuth (citizens only — no anonymous AI calls).
 */
export async function detectFromUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Validate request body.
    const parsed = detectSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      next(AppError.validation(issues));
      return;
    }

    const { fileId } = parsed.data;
    const userId = req.user!.id;

    // 2. Fetch the uploaded file record.
    const file = await prisma.mediaUpload.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        userId: true,
        s3Key: true,
        mimeType: true,
        linkedAt: true,
      },
    });

    if (!file) {
      next(new AppError("File not found.", 404, { code: "FILE_NOT_FOUND" }));
      return;
    }

    // 3. Verify ownership — prevent IDOR.
    if (file.userId !== userId) {
      next(new AppError("You do not own this file.", 403, { code: "FORBIDDEN" }));
      return;
    }

    // 4. Only images are supported for AI detection.
    if (!file.mimeType.startsWith("image/")) {
      next(
        new AppError("AI detection is only available for photo uploads.", 422, {
          code: "UNSUPPORTED_FILE_TYPE",
        }),
      );
      return;
    }

    // 5. Prevent re-analysis of files already attached to a complaint.
    if (file.linkedAt) {
      next(
        new AppError(
          "This file is already attached to a complaint and cannot be re-analysed.",
          422,
          { code: "FILE_ALREADY_LINKED" },
        ),
      );
      return;
    }

    // 6. Fetch image buffer from S3.
    const buffer = await getFileBuffer(file.s3Key);

    // 7. Run Reckoning detection (pass userId for annotated image S3 path).
    const result = await runReckoningDetection(buffer, file.mimeType, userId);

    // 8. AI unavailable — graceful degradation.
    if (!result) {
      res.status(503).json({
        success: false,
        error: {
          code: "AI_UNAVAILABLE",
          message:
            "AI analysis is temporarily unavailable. You can still submit your complaint manually.",
        },
      });
      return;
    }

    // 9. Return successful detection with annotated image.
    res.status(200).json({
      success: true,
      data: {
        suggestedCategory: result.suggestedCategory,
        suggestedSeverity: result.suggestedSeverity,
        confidence: result.confidence,
        allDetectedIssues: result.allIssues,
        totalDetected: result.raw.totalDetected,
        inferenceMs: result.raw.inferenceMs,
        detections: result.raw.detections,
        annotatedImage: result.annotatedImageUrl
          ? {
              url: result.annotatedImageUrl,
              expiresIn: DOWNLOAD_EXPIRY_SECONDS,
              s3Key: result.annotatedS3Key,
            }
          : null,
        message:
          result.raw.totalDetected > 0
            ? `Detected ${result.raw.totalDetected} issue(s). Review and confirm.`
            : "No issues detected. You can still file a manual report.",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ai/result/:s3Key/download
 *
 * Re-generate a presigned download URL for an annotated result image.
 * The s3Key path parameter is base64-encoded to avoid URL path issues.
 *
 * Auth: requireAuth — verifies the S3 key belongs to the requesting user.
 */
export async function downloadAnnotatedResult(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const encodedKey = req.params.s3Key;

    if (!encodedKey || Array.isArray(encodedKey)) {
      next(new AppError("Missing s3Key parameter.", 400, { code: "MISSING_PARAM" }));
      return;
    }

    // Decode the base64url-encoded S3 key.
    let s3Key: string;
    try {
      s3Key = Buffer.from(encodedKey as string, "base64url").toString("utf-8");
    } catch {
      next(new AppError("Invalid s3Key encoding.", 400, { code: "INVALID_PARAM" }));
      return;
    }

    // Security: verify the S3 key belongs to this user (path prefix check).
    const expectedPrefix = `ai-results/${userId}/`;
    if (!s3Key.startsWith(expectedPrefix)) {
      next(
        new AppError("You do not have access to this resource.", 403, {
          code: "FORBIDDEN",
        }),
      );
      return;
    }

    // Generate fresh presigned URL.
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
      { expiresIn: DOWNLOAD_EXPIRY_SECONDS },
    );

    res.status(200).json({
      success: true,
      data: {
        url,
        expiresIn: DOWNLOAD_EXPIRY_SECONDS,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ai/image/:complaintId
 *
 * Proxy-streams the annotated AI image from S3 directly through the backend.
 * This avoids CORS/presigned-URL issues in the browser. The response is the
 * raw image bytes with correct Content-Type headers.
 *
 * Auth: requireAuth — ownership verified via complaint_ai_results join.
 */
export async function proxyAnnotatedImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const complaintId = req.params.complaintId as string;
    const userId = req.user!.id;

    // Find the AI result row for this complaint (owner check via join).
    const row = await prisma.complaintAiResult.findFirst({
      where: {
        complaintId,
        complaint: { userId, deletedAt: null },
      },
      select: { annotatedImageS3Key: true },
    });

    // Fallback: check aiAnnotatedImageKey on the complaint itself.
    const s3Key =
      row?.annotatedImageS3Key ??
      (
        await prisma.complaint.findFirst({
          where: { id: complaintId, userId, deletedAt: null },
          select: { aiAnnotatedImageKey: true },
        })
      )?.aiAnnotatedImageKey ??
      null;

    if (!s3Key) {
      res.status(404).json({ success: false, message: "No annotated image available." });
      return;
    }

    // Stream the S3 object directly to the response.
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const s3Response = await s3Client.send(command);

    // Set appropriate headers for image response.
    res.setHeader("Content-Type", s3Response.ContentType || "image/jpeg");
    if (s3Response.ContentLength) {
      res.setHeader("Content-Length", s3Response.ContentLength.toString());
    }
    res.setHeader("Cache-Control", "private, max-age=3600");

    // Pipe the readable stream to the HTTP response.
    const stream = s3Response.Body as import("stream").Readable;
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ai/detect/:complaintId
 *
 * Retrieves the AI detection result for a submitted complaint.
 * Resolves the S3 presigned URL for the annotated image if present.
 *
 * Falls back to reading AI fields stored directly on the complaint row when
 * no `complaint_ai_results` record exists (e.g. the worker hasn't processed
 * the job yet or Redis was unavailable at submission time).
 *
 * Auth: requireAuth (owner check).
 */
export async function getComplaintDetectionResult(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const complaintId = req.params.complaintId as string;
    const userId = req.user!.id;

    // First try the dedicated AI results table (populated by the worker).
    const row = await prisma.complaintAiResult.findFirst({
      where: {
        complaintId,
        complaint: {
          userId,
          deletedAt: null,
        },
      },
      select: {
        suggestedCategory: true,
        suggestedSeverity: true,
        confidence: true,
        totalDetected: true,
        detections: true,
        inferenceMs: true,
        message: true,
        annotatedImageS3Key: true,
      },
    });

    if (row && row.annotatedImageS3Key) {
      const annotatedImageUrl = BUCKET_NAME
        ? await getSignedUrl(
            s3Client,
            new GetObjectCommand({ Bucket: BUCKET_NAME, Key: row.annotatedImageS3Key }),
            { expiresIn: DOWNLOAD_EXPIRY_SECONDS },
          )
        : null;

      res.status(200).json({
        success: true,
        data: {
          suggestedCategory: row.suggestedCategory,
          suggestedSeverity: row.suggestedSeverity,
          confidence: row.confidence,
          totalDetected: row.totalDetected,
          detections: row.detections ?? [],
          annotatedImage: annotatedImageUrl
            ? {
                url: annotatedImageUrl,
                expiresIn: DOWNLOAD_EXPIRY_SECONDS,
                s3Key: row.annotatedImageS3Key,
              }
            : null,
          message: row.message ?? "AI analysis completed.",
        },
      });
      return;
    }

    // Fallback: read AI fields directly from the complaint row.
    // This covers cases where the worker hasn't run yet but the frontend
    // pre-computed AI results before submission.
    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        userId,
        deletedAt: null,
      },
      select: {
        aiDetected: true,
        aiCategory: true,
        aiConfidence: true,
        aiAnnotatedImageKey: true,
        aiRawResult: true,
      },
    });

    if (!complaint?.aiDetected || !complaint.aiAnnotatedImageKey) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    // Generate presigned URL from the complaint's stored S3 key.
    const annotatedImageUrl = BUCKET_NAME
      ? await getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: BUCKET_NAME, Key: complaint.aiAnnotatedImageKey }),
          { expiresIn: DOWNLOAD_EXPIRY_SECONDS },
        )
      : null;

    const raw = (complaint.aiRawResult as Record<string, unknown>) ?? {};
    const totalDetected = typeof raw.totalDetected === "number" ? raw.totalDetected : 0;
    const inferenceMs = typeof raw.inferenceMs === "number" ? raw.inferenceMs : null;

    res.status(200).json({
      success: true,
      data: {
        suggestedCategory: complaint.aiCategory,
        suggestedSeverity: null,
        confidence: complaint.aiConfidence,
        totalDetected,
        detections: raw.detections ?? [],
        annotatedImage: annotatedImageUrl
          ? {
              url: annotatedImageUrl,
              expiresIn: DOWNLOAD_EXPIRY_SECONDS,
              s3Key: complaint.aiAnnotatedImageKey,
            }
          : null,
        inferenceMs,
        message: totalDetected > 0
          ? `Detected ${totalDetected} issue(s). Review and confirm.`
          : "No issues detected.",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ai/health
 *
 * Public endpoint — check if the Reckoning API is online.
 * Always returns 200 (the health check itself never fails the endpoint).
 */
export async function ReckoningHealth(
  _req: Request,
  res: Response,
): Promise<void> {
  const health = await checkReckoningHealth();

  res.status(200).json({
    success: true,
    data: {
      Reckoning: {
        online: health.online,
        latencyMs: health.latencyMs,
        modelInfo: health.modelInfo,
      },
      timestamp: new Date().toISOString(),
    },
  });
}
