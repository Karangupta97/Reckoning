/**
 * Upload router.
 *
 * `POST /api/upload` accepts up to 5 files (field name `files`) via multer
 * memory storage, then hands off to the controller. A wrapper translates
 * multer's own errors (size/count limits) into the standard {@link AppError}
 * envelope so clients get consistent responses.
 *
 * Order: requireAuth → rate limit → multer parse → controller.
 */

import { Router, type NextFunction, type Request, type Response } from "express";
import multer, { MulterError } from "multer";
import * as uploadController from "./upload.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { uploadRateLimiter } from "../../middleware/rateLimiter.js";
import { AppError } from "../../utils/AppError.js";
import { MAX_VIDEO_BYTES } from "./upload.service.js";

/** Field name expected for the file parts. */
const FILE_FIELD = "files";

/** Maximum files multer will accept per request. */
const MAX_FILES = 5;

/**
 * Multer instance: in-memory storage (buffers are processed by sharp/ffmpeg
 * and streamed to S3, never written to local disk). The byte ceiling is set to
 * the largest allowed size (video, 100MB); per-kind limits are enforced
 * precisely in the service after the true type is known.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_BYTES,
    files: MAX_FILES,
  },
});

/**
 * Wrap multer's `.array()` middleware so its errors become {@link AppError}s.
 *
 * @returns Express middleware that parses the multipart body or forwards a
 *          normalised 400 error.
 */
function parseMultipart() {
  const handler = upload.array(FILE_FIELD, MAX_FILES);
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "File exceeds the maximum allowed size."
            : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
              ? `Too many files. Maximum is ${MAX_FILES} per request.`
              : "Invalid file upload.";
        next(new AppError(message, 400, { code: "UPLOAD_REJECTED" }));
        return;
      }
      next(err);
    });
  };
}

/**
 * Express router for media uploads. Mount under `/api/upload`:
 *
 * ```ts
 * app.use("/api/upload", uploadRouter);
 * ```
 */
export const uploadRouter: Router = Router();

uploadRouter.post(
  "/",
  requireAuth,
  uploadRateLimiter,
  parseMultipart(),
  uploadController.uploadFiles,
);

uploadRouter.delete("/:mediaId", requireAuth, uploadController.deleteFile);
