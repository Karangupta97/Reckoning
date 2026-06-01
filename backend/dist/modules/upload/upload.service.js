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
/** First-bytes helpers ------------------------------------------------------ */
/** True when `buf` starts with the given byte sequence. */
function startsWith(buf, bytes) {
    if (buf.length < bytes.length)
        return false;
    return bytes.every((b, i) => buf[i] === b);
}
/** True when bytes 4..7 spell the ISO-BMFF "ftyp" box marker (mp4/mov). */
function hasFtypBox(buf) {
    // "ftyp" === 0x66 0x74 0x79 0x70 at offset 4.
    return (buf.length >= 12 &&
        buf[4] === 0x66 &&
        buf[5] === 0x74 &&
        buf[6] === 0x79 &&
        buf[7] === 0x70);
}
/** True when bytes 0..3 == "RIFF" and 8..11 == "WEBP". */
function isWebp(buf) {
    return (buf.length >= 12 &&
        startsWith(buf, [0x52, 0x49, 0x46, 0x46]) &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50);
}
/**
 * Allowed MIME types mapped to their kind, extension, and magic-byte matcher.
 * Both `image/jpg` and `image/jpeg` are accepted because some clients send the
 * former.
 */
const ALLOWED_TYPES = {
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
/**
 * Validate a buffer's true type against the declared MIME type using magic
 * bytes (not the extension/header alone).
 *
 * @param buffer   Raw file bytes (at least the first 12 are inspected).
 * @param mimetype Declared MIME type from the multipart part.
 * @returns `true` when the declared type is allowed AND the bytes match it.
 */
export function validateFileType(buffer, mimetype) {
    const allowed = ALLOWED_TYPES[mimetype];
    if (!allowed)
        return false;
    return allowed.matches(buffer);
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
async function probeVideoDuration(buffer, ext) {
    const dir = await mkdtemp(join(tmpdir(), "rw-upload-"));
    const filePath = join(dir, `probe.${ext}`);
    try {
        await writeFile(filePath, buffer);
        const duration = await new Promise((resolve) => {
            ffmpeg.ffprobe(filePath, (err, data) => {
                if (err) {
                    // eslint-disable-next-line no-console
                    console.warn("[upload.service] ffprobe unavailable or failed; skipping duration check:", err instanceof Error ? err.message : err);
                    resolve(null);
                    return;
                }
                const seconds = data.format?.duration;
                resolve(typeof seconds === "number" && Number.isFinite(seconds) ? seconds : null);
            });
        });
        return duration;
    }
    finally {
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
function buildS3Key(userId, ext) {
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
export async function uploadFileToS3(file, userId, fileType = file.mimetype) {
    // 1. Magic-byte + allow-list validation (declared type must match bytes).
    if (!validateFileType(file.buffer, fileType)) {
        throw new AppError("Unsupported or corrupted file. Allowed: jpg, png, webp, mp4, mov, webm.", 400, { code: "INVALID_FILE_TYPE" });
    }
    // Defence in depth: cross-check the detected type from content sniffing.
    const sniffed = await fileTypeFromBuffer(file.buffer);
    if (sniffed && !ALLOWED_TYPES[sniffed.mime]) {
        throw new AppError("Unsupported file content.", 400, {
            code: "INVALID_FILE_TYPE",
        });
    }
    const spec = ALLOWED_TYPES[fileType];
    // `spec` is guaranteed by validateFileType, but narrow for the type checker.
    if (!spec) {
        throw new AppError("Unsupported file type.", 400, { code: "INVALID_FILE_TYPE" });
    }
    let body = file.buffer;
    let outputMime = fileType;
    let outputExt = spec.ext;
    let width;
    let height;
    let duration;
    if (spec.kind === "image") {
        // 2a. Size ceiling for images.
        if (file.size > MAX_IMAGE_BYTES) {
            throw new AppError("Image exceeds the 10MB limit.", 400, {
                code: "FILE_TOO_LARGE",
            });
        }
        // 3a. Strip EXIF + resize + compress. PNGs stay PNG; everything else → JPEG.
        const pipeline = sharp(file.buffer, { failOn: "error" })
            .rotate() // bake in EXIF orientation before metadata is dropped
            .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });
        let processed;
        if (fileType === "image/png") {
            processed = await pipeline
                .png({ quality: IMAGE_QUALITY, compressionLevel: 9 })
                .toBuffer({ resolveWithObject: true });
            outputMime = "image/png";
            outputExt = "png";
        }
        else if (fileType === "image/webp") {
            processed = await pipeline
                .webp({ quality: IMAGE_QUALITY })
                .toBuffer({ resolveWithObject: true });
            outputMime = "image/webp";
            outputExt = "webp";
        }
        else {
            processed = await pipeline
                .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
                .toBuffer({ resolveWithObject: true });
            outputMime = "image/jpeg";
            outputExt = "jpg";
        }
        body = processed.data;
        width = processed.info.width;
        height = processed.info.height;
    }
    else {
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
                throw new AppError(`Video is too long (${Math.round(seconds)}s). Maximum is ${MAX_VIDEO_SECONDS}s.`, 400, { code: "VIDEO_TOO_LONG" });
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
    }
    catch (error) {
        await deleteS3Object(key).catch((cleanupError) => {
            // eslint-disable-next-line no-console
            console.error("[upload.service] Failed to clean up orphaned S3 object:", cleanupError);
        });
        if (error instanceof AppError)
            throw error;
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
export async function deleteUploadedFile(mediaId, userId) {
    const media = await prisma.mediaUpload.findUnique({
        where: { id: mediaId },
        select: { id: true, userId: true, s3Key: true, isDeleted: true, linkedAt: true },
    });
    // Same response for "missing" and "not yours" so ownership can't be probed.
    if (!media || media.userId !== userId) {
        throw new AppError("Upload not found.", 404, { code: "MEDIA_NOT_FOUND" });
    }
    if (media.linkedAt) {
        throw new AppError("This file is attached to a complaint and cannot be deleted.", 409, { code: "MEDIA_IN_USE" });
    }
    if (media.isDeleted)
        return; // idempotent
    await deleteS3Object(media.s3Key);
    await prisma.mediaUpload.update({
        where: { id: mediaId },
        data: { isDeleted: true },
    });
}
//# sourceMappingURL=upload.service.js.map