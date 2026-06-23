/**
 * Sub-district admin AI controller — admin-accessible AI detection results.
 *
 * Mirrors the citizen /api/ai/detect/:complaintId and /api/ai/image/:complaintId
 * endpoints but uses admin auth (requireAdminAuth) and skips citizen ownership checks.
 * Jurisdiction is verified via the complaint's subDistrictId.
 */

import type { NextFunction, Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../../config/prisma.js";
import { BUCKET_NAME, s3Client } from "../../../config/s3.js";
import { AppError } from "../../../utils/AppError.js";

/** Presigned URL lifetime (1 hour). */
const DOWNLOAD_EXPIRY_SECONDS = 3600;

/**
 * GET /api/admin/subdistrict/complaints/:id/ai
 *
 * Returns AI detection results for a complaint (same shape as citizen /api/ai/detect/:complaintId).
 * Auth: requireAdminAuth + SUB_DISTRICT_ADMIN role.
 */
export async function getAdminComplaintAiResult(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = req.admin;
    if (!admin?.subDistrictId) {
      throw new AppError("No sub-district assigned.", 400, { code: "NO_SUB_DISTRICT" });
    }

    const complaintId = req.params.id as string;

    // First try the dedicated AI results table (populated by the worker).
    const row = await prisma.complaintAiResult.findFirst({
      where: {
        complaintId,
        complaint: {
          subDistrictId: admin.subDistrictId,
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
            ? { url: annotatedImageUrl, expiresIn: DOWNLOAD_EXPIRY_SECONDS, s3Key: row.annotatedImageS3Key }
            : null,
          message: row.message ?? "AI analysis completed.",
        },
      });
      return;
    }

    // Fallback: read AI fields directly from the complaint row.
    const complaint = await prisma.complaint.findFirst({
      where: {
        id: complaintId,
        subDistrictId: admin.subDistrictId,
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

    const annotatedImageUrl = BUCKET_NAME
      ? await getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: BUCKET_NAME, Key: complaint.aiAnnotatedImageKey }),
          { expiresIn: DOWNLOAD_EXPIRY_SECONDS },
        )
      : null;

    const raw = (complaint.aiRawResult as Record<string, unknown>) ?? {};
    const totalDetected = typeof raw.totalDetected === "number" ? raw.totalDetected : 0;

    res.status(200).json({
      success: true,
      data: {
        suggestedCategory: complaint.aiCategory,
        suggestedSeverity: null,
        confidence: complaint.aiConfidence,
        totalDetected,
        detections: raw.detections ?? [],
        annotatedImage: annotatedImageUrl
          ? { url: annotatedImageUrl, expiresIn: DOWNLOAD_EXPIRY_SECONDS, s3Key: complaint.aiAnnotatedImageKey }
          : null,
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
 * GET /api/admin/subdistrict/complaints/:id/ai/image
 *
 * Streams the annotated image directly (bypasses S3 CORS).
 * Auth: requireAdminAuth + SUB_DISTRICT_ADMIN role.
 */
export async function proxyAdminComplaintAiImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = req.admin;
    if (!admin?.subDistrictId) {
      throw new AppError("No sub-district assigned.", 400, { code: "NO_SUB_DISTRICT" });
    }

    const complaintId = req.params.id as string;

    // Find the AI result S3 key (jurisdiction check via subDistrictId).
    const row = await prisma.complaintAiResult.findFirst({
      where: {
        complaintId,
        complaint: { subDistrictId: admin.subDistrictId, deletedAt: null },
      },
      select: { annotatedImageS3Key: true },
    });

    const s3Key =
      row?.annotatedImageS3Key ??
      (
        await prisma.complaint.findFirst({
          where: { id: complaintId, subDistrictId: admin.subDistrictId, deletedAt: null },
          select: { aiAnnotatedImageKey: true },
        })
      )?.aiAnnotatedImageKey ??
      null;

    if (!s3Key) {
      res.status(404).json({ success: false, message: "No annotated image available." });
      return;
    }

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const s3Response = await s3Client.send(command);

    res.setHeader("Content-Type", s3Response.ContentType || "image/jpeg");
    if (s3Response.ContentLength) {
      res.setHeader("Content-Length", s3Response.ContentLength.toString());
    }
    res.setHeader("Cache-Control", "private, max-age=3600");

    const stream = s3Response.Body as import("stream").Readable;
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}
