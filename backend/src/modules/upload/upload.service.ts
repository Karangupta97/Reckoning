/**
 * Upload service — all media-ingestion business logic.
 *
 * Pipeline for a single file:
 *   1. Double-check the declared MIME type against the file's magic bytes
 *      ({@link validateFileType}) — never trust the client extension/header.
 *   2. Enforce a per-kind size ceiling (10 MB images / 100 MB videos).
 *   3. Images: strip EXIF, resize to ≤ 1920px wide, re-encode at quality 80
 *      (sharp). Videos: reject clips longer than 30s (ffprobe).
 *   4. Upload to S3 under `uploads/{userId}/{year}/{month}/{uuid}.{ext}`.
 *   5. Persist a {@link MediaUpload} row and return its public projection.
 *
 * Security notes:
 *   - Magic-byte validation defeats trivial content-type spoofing.
 *   - EXIF stripping removes embedded GPS/camera metadata before storage.
 *   - {@link deleteUploadedFile} verifies ownership to prevent IDOR.
 */

import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { fileTypeFromBuffer } from "file-type";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { deleteS3Object } from "../../config/s3.js";
import { putObject, resolveMediaUrl } from "../../services/s3.service.js";

/** Broad media kind used to branch processing and size limits. */
export type MediaKind = "image" | "video";

/** Maximum image size accepted, in bytes (10 MB). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Maximum video size accepted, in bytes (100 MB). */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/** Maximum video duration accepted, in seconds. */
export const MAX_VIDEO_SECONDS = 30;

/** Max width images are downscaled to (height scales proportionally). */
const MAX_IMAGE_WIDTH = 1920;

/** JPEG/WebP re-encode quality after processing. */
const IMAGE_QUALITY = 80;

/** Descriptor for an accepted upload type. */
interface AllowedType {
  /** Broad kind, drives processing + size limit. */
  kind: MediaKind;
  /** Canonical file extension used in the S3 key. */
  ext: string;
  /** Synchronous magic-byte check for this type. */
  matches: (buf: Buffer) => boolean;
}

/** First-bytes helpers ------------------------------------------------------ */

/** True when `buf` starts with the given byte sequence. */
function startsWith(buf: Buffer, bytes: readonly number[]): boolean {
  if (buf.length < bytes.length) return false;
  return bytes.every((b, i) => buf[i] === b);
}

/** True when bytes 4..7 spell the ISO-BMFF "ftyp" box marker (mp4/mov). */
function hasFtypBox(buf: Buffer): boolean {
  // "ftyp" === 0x66 0x74 0x79 0x70 at offset 4.
  return (
    buf.length >= 12 &&
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  );
}

/** True when bytes 0..3 == "RIFF" and 8..11 == "WEBP". */
function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    startsWith(buf, [0x52, 0x49, 0x46, 0x46]) &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  );
}

/**
 * Allowed MIME types mapped to their kind, extension, and magic-byte matcher.
 * Both `image/jpg` and `image/jpeg` are accepted because some clients send the
 * former.
 */
const ALLOWED_TYPES: Readonly<Record<string, AllowedType>> = {
  "image/jpeg": {
    kind: "image",
    ext: "jpg",
    matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  "image/jpg": {
    kind: "image",
    ext: "jpg",
    matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  "image/png": {
    kind: "image",
    ext: "png",
    matches: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  "image/webp": {
    kind: "image",
    ext: "webp",
    matches: isWebp,
  },
  "image/heic": {
    kind: "image",
    ext: "heic",
    matches: hasFtypBox,
  },
  "image/heif": {
    kind: "image",
    ext: "heif",
    matches: hasFtypBox,
  },
  "video/mp4": {
    kind: "video",
    ext: "mp4",
    matches: hasFtypBox,
  },
  "video/quicktime": {
    kind: "video",
    ext: "mov",
    matches: hasFtypBox,
  },
  "video/webm": {
    kind: "video",
    ext: "webm",
    matches: (b) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]),
  },
};

/** Public result of a successful upload. */
export interface UploadResult {
  /** `MediaUpload` row id (used later to link to a complaint). */
  mediaId: string;
  /** Fetchable URL (CDN or presigned). */
  url: string;
  /** S3 object key (internal — not exposed publicly). */
  key: string;
  /** Stored byte size after any processing. */
  size: number;
  /** Final MIME type stored. */
  mimeType: string;
  /** Image width in pixels, when known. */
  width?: number;
  /** Image height in pixels, when known. */
  height?: number;
  /** Video duration in seconds, when known. */
  duration?: number;
}

/**
 * Validate a buffer's true type against the declared MIME type using magic
 * bytes (content is authoritative — the declared header is never trusted on
 * its own).
 *
 * Behaviour:
 *   - If `mimetype` is a recognised media type, the bytes MUST match it
 *     (rejects a `.png` payload sent as `image/jpeg`, etc.).
 *   - If `mimetype` is missing/generic (e.g. `application/octet-stream`), the
 *     buffer is accepted when its magic bytes match ANY allowed type.
 *
 * @param buffer   Raw file bytes (at least the first 12 are inspected).
 * @param mimetype Declared MIME type from the multipart part.
 * @returns `true` when the content is a recognised allowed type.
 */
export function validateFileType(buffer: Buffer, mimetype: string): boolean {
  const declared = ALLOWED_TYPES[mimetype];
  if (declared) return declared.matches(buffer);
  // Declared type unknown/generic → fall back to pure content inspection.
  return magicMatch(buffer) !== null;
}

/**
 * Find the first allowed type whose magic-byte matcher accepts the buffer.
 *
 * Insertion order means `image/jpeg` is preferred over the `image/jpg` alias.
 *
 * @param buffer Raw file bytes.
 * @returns The matched type + its canonical MIME key, or `null`.
 */
function magicMatch(buffer: Buffer): { mimeKey: string; spec: AllowedType } | null {
  for (const [mimeKey, spec] of Object.entries(ALLOWED_TYPES)) {
    if (spec.matches(buffer)) return { mimeKey, spec };
  }
  return null;
}

/**
 * Resolve the authoritative media type for a buffer.
 *
 * Order of trust: content sniffing (`file-type`) → our own magic-byte matchers
 * → a recognised declared MIME type that matches the bytes. The declared header
 * alone is never sufficient. Returns `null` when the content is not a
 * recognised, allowed media type.
 *
 * @param buffer       Raw file bytes.
 * @param declaredMime Declared MIME type from the multipart part.
 * @returns The canonical MIME key + type spec, or `null` when unsupported.
 */
async function resolveAllowedType(
  buffer: Buffer,
  declaredMime: string,
): Promise<{ mimeKey: string; spec: AllowedType } | null> {
  // 1. Content sniffing is the strongest signal.
  const sniffed = await fileTypeFromBuffer(buffer);
  if (sniffed) {
    const spec = ALLOWED_TYPES[sniffed.mime];
    // Sniffed to a concrete type: allowed → use it; not allowed → reject.
    return spec ? { mimeKey: sniffed.mime, spec } : null;
  }

  // 2. file-type couldn't identify it — try our own magic-byte matchers.
  const matched = magicMatch(buffer);
  if (matched) return matched;

  // 3. Last resort: a recognised declared type whose bytes actually match.
  const declared = ALLOWED_TYPES[declaredMime];
  if (declared && declared.matches(buffer)) {
    return { mimeKey: declaredMime, spec: declared };
  }

  return null;
}

/**
 * Probe a video buffer's duration (seconds) via ffprobe.
 *
 * ffprobe needs a path, so the buffer is written to a short-lived temp file
 * which is always cleaned up. When the ffprobe binary is unavailable the
 * function resolves to `null` (duration unknown) rather than throwing, so a
 * missing system dependency degrades gracefully instead of rejecting valid
 * uploads — callers decide how to treat an unknown duration.
 *
 * @param buffer Raw video bytes.
 * @param ext    File extension (so ffprobe picks the right demuxer).
 * @returns Duration in seconds, or `null` when it cannot be determined.
 */
async function probeVideoDuration(
  buffer: Buffer,
  ext: string,
): Promise<number | null> {
  const dir = await mkdtemp(join(tmpdir(), "rw-upload-"));
  const filePath = join(dir, `probe.${ext}`);
  try {
    await writeFile(filePath, buffer);
    const duration = await new Promise<number | null>((resolve) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.warn(
            "[upload.service] ffprobe unavailable or failed; skipping duration check:",
            err instanceof Error ? err.message : err,
          );
          resolve(null);
          return;
        }
        const seconds = data.format?.duration;
        resolve(typeof seconds === "number" && Number.isFinite(seconds) ? seconds : null);
      });
    });
    return duration;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Build the deterministic S3 key for a user's upload.
 *
 * Layout: `uploads/{userId}/{year}/{month}/{uuid}.{ext}` (month zero-padded).
 *
 * @param userId Owner user id.
 * @param ext    Canonical file extension.
 * @returns The S3 object key.
 */
function buildS3Key(userId: string, ext: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `uploads/${userId}/${year}/${month}/${randomUUID()}.${ext}`;
}

/**
 * Process, validate, upload, and record a single file.
 *
 * @param file     Multer file (memory storage) with `buffer`, `mimetype`, `size`.
 * @param userId   Authenticated owner id.
 * @param fileType Declared MIME type (defaults to `file.mimetype`).
 * @returns The persisted upload projection.
 * @throws {AppError} 400 on type/size/duration violations; 502/503 on storage
 *         failure / misconfiguration.
 */
export async function uploadFileToS3(
  file: Express.Multer.File,
  userId: string,
  fileType: string = file.mimetype,
): Promise<UploadResult> {
  // 1. Resolve the TRUE media type from content (magic bytes + sniffing).
  //    The declared `fileType` header is only a hint, never trusted alone, so
  //    a valid file sent as `application/octet-stream` is still accepted, while
  //    a spoofed extension/header is rejected.
  const resolved = await resolveAllowedType(file.buffer, fileType);
  if (!resolved) {
    throw new AppError(
      "Unsupported or corrupted file. Allowed: jpg, png, webp, heic, heif, mp4, mov, webm.",
      400,
      { code: "INVALID_FILE_TYPE" },
    );
  }
  const { mimeKey: detectedMime, spec } = resolved;

  let body: Buffer = file.buffer;
  let outputMime = detectedMime;
  let outputExt = spec.ext;
  let width: number | undefined;
  let height: number | undefined;
  let duration: number | undefined;

  if (spec.kind === "image") {
    // 2a. Size ceiling for images.
    if (file.size > MAX_IMAGE_BYTES) {
      throw new AppError("Image exceeds the 10MB limit.", 400, {
        code: "FILE_TOO_LARGE",
      });
    }
    // 3a. Strip EXIF + resize + compress. PNGs stay PNG, WebP stays WebP;
    //     everything else is normalised to JPEG.
    const pipeline = sharp(file.buffer, { failOn: "error" })
      .rotate() // bake in EXIF orientation before metadata is dropped
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });

    let processed: { data: Buffer; info: sharp.OutputInfo };
    if (detectedMime === "image/png") {
      processed = await pipeline
        .png({ quality: IMAGE_QUALITY, compressionLevel: 9 })
        .toBuffer({ resolveWithObject: true });
      outputMime = "image/png";
      outputExt = "png";
    } else if (detectedMime === "image/webp") {
      processed = await pipeline
        .webp({ quality: IMAGE_QUALITY })
        .toBuffer({ resolveWithObject: true });
      outputMime = "image/webp";
      outputExt = "webp";
    } else {
      processed = await pipeline
        .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      outputMime = "image/jpeg";
      outputExt = "jpg";
    }
    body = processed.data;
    width = processed.info.width;
    height = processed.info.height;
  } else {
    // 2b. Size ceiling for videos.
    if (file.size > MAX_VIDEO_BYTES) {
      throw new AppError("Video exceeds the 100MB limit.", 400, {
        code: "FILE_TOO_LARGE",
      });
    }
    // 3b. Duration guard (skipped only when ffprobe can't run — see helper).
    const seconds = await probeVideoDuration(file.buffer, spec.ext);
    if (seconds !== null) {
      if (seconds > MAX_VIDEO_SECONDS) {
        throw new AppError(
          `Video is too long (${Math.round(seconds)}s). Maximum is ${MAX_VIDEO_SECONDS}s.`,
          400,
          { code: "VIDEO_TOO_LONG" },
        );
      }
      duration = seconds;
    }
  }

  // 4. Upload to S3.
  const key = buildS3Key(userId, outputExt);
  await putObject(key, body, outputMime);

  // 5. Persist + project. If the DB write fails after upload, best-effort
  //    delete the orphaned object so storage doesn't leak.
  try {
    const url = await resolveMediaUrl(key);
    const record = await prisma.mediaUpload.create({
      data: {
        userId,
        s3Key: key,
        url,
        mimeType: outputMime,
        size: body.length,
        width: width ?? null,
        height: height ?? null,
        duration: duration ?? null,
      },
      select: { id: true, url: true, s3Key: true, size: true, mimeType: true, width: true, height: true, duration: true },
    });

    return {
      mediaId: record.id,
      url: record.url,
      key: record.s3Key,
      size: record.size,
      mimeType: record.mimeType,
      ...(record.width !== null ? { width: record.width } : {}),
      ...(record.height !== null ? { height: record.height } : {}),
      ...(record.duration !== null ? { duration: record.duration } : {}),
    };
  } catch (error) {
    await deleteS3Object(key).catch((cleanupError) => {
      // eslint-disable-next-line no-console
      console.error("[upload.service] Failed to clean up orphaned S3 object:", cleanupError);
    });
    if (error instanceof AppError) throw error;
    // eslint-disable-next-line no-console
    console.error("[upload.service] Failed to persist MediaUpload:", error);
    throw new AppError("Failed to record the uploaded file.", 500, { cause: error });
  }
}

/**
 * Soft-delete an uploaded file and remove it from S3.
 *
 * Verifies the file belongs to `userId` (IDOR prevention) and is not already
 * linked to a complaint before deleting.
 *
 * @param mediaId Media row id to delete.
 * @param userId  Authenticated owner id.
 * @throws {AppError} 404 when not found / not owned; 409 when already linked.
 */
export async function deleteUploadedFile(
  mediaId: string,
  userId: string,
): Promise<void> {
  const media = await prisma.mediaUpload.findUnique({
    where: { id: mediaId },
    select: { id: true, userId: true, s3Key: true, isDeleted: true, linkedAt: true },
  });

  // Same response for "missing" and "not yours" so ownership can't be probed.
  if (!media || media.userId !== userId) {
    throw new AppError("Upload not found.", 404, { code: "MEDIA_NOT_FOUND" });
  }
  if (media.linkedAt) {
    throw new AppError(
      "This file is attached to a complaint and cannot be deleted.",
      409,
      { code: "MEDIA_IN_USE" },
    );
  }
  if (media.isDeleted) return; // idempotent

  await deleteS3Object(media.s3Key);
  await prisma.mediaUpload.update({
    where: { id: mediaId },
    data: { isDeleted: true },
  });
}
