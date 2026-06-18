/**
 * Reckoning AI module — Express router.
 *
 * Mounts:
 *   POST /detect                  → requireAuth → detectFromUpload
 *   GET  /result/:s3Key/download  → requireAuth → downloadAnnotatedResult
 *   GET  /health                  → ReckoningHealth (public, no auth)
 */

import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  detectFromUpload,
  downloadAnnotatedResult,
  ReckoningHealth,
  getComplaintDetectionResult,
} from "./ai.controller.js";

export const aiRouter: Router = Router();

// Citizen-only: analyse an uploaded image before filing a complaint.
aiRouter.post("/detect", requireAuth, detectFromUpload);

// Citizen-only: fetch AI detection results of a submitted complaint.
aiRouter.get("/detect/:complaintId", requireAuth, getComplaintDetectionResult);

// Citizen-only: re-generate presigned URL for annotated result image.
aiRouter.get("/result/:s3Key/download", requireAuth, downloadAnnotatedResult);

// Public: check Reckoning API availability.
aiRouter.get("/health", ReckoningHealth);
