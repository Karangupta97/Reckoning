/**
 * High-level S3 operations for the media pipeline.
 *
 * Builds on the low-level client in `config/s3.ts`. Responsibilities:
 *
 *   - {@link putObject}      — upload a buffer with the correct content type.
 *   - {@link resolveMediaUrl} — produce the presigned URL stored/returned for
 *     an object.
 *
 * All failures are logged server-side and re-thrown as {@link AppError} so the
 * AWS SDK's internals never leak into an API response.
 */

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import {
  s3Client,
  BUCKET_NAME,
  assertS3Configured,
  getSignedDownloadUrl,
  DEFAULT_MEDIA_EXPIRY_SECONDS,
} from "../config/s3.js";
import { AppError } from "../utils/AppError.js";

/**
 * Upload a buffer to S3 under the given key.
 *
 * @param key         Destination S3 object key.
 * @param body        Raw file bytes.
 * @param contentType MIME type to store as `Content-Type` (so the object is
 *                    served with correct headers).
 * @throws {AppError} 502 when the upload fails, 503 when S3 is not configured.
 */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  assertS3Configured();
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Long-lived caching: objects are immutable (unique keys per upload).
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[s3.service] putObject failed:", error);
    throw new AppError("Failed to store the uploaded file.", 502, {
      code: "UPLOAD_FAILED",
      cause: error,
    });
  }
}

/**
 * Generate a short-lived presigned URL for a stored media object.
 *
 * URLs are **not** cached or stored — they are regenerated on every request.
 * This ensures leaked URLs expire quickly (default: 1 hour) and the system
 * never serves stale/expired links from the database.
 *
 * @param key       S3 object key.
 * @param expiresIn Optional custom lifetime in seconds (defaults to 1 hour).
 * @returns A fetchable presigned URL valid for the specified lifetime.
 */
export async function resolveMediaUrl(
  key: string,
  expiresIn: number = DEFAULT_MEDIA_EXPIRY_SECONDS,
): Promise<string> {
  return getSignedDownloadUrl(key, expiresIn);
}

/**
 * Download an object from S3 and return its contents as a Buffer.
 *
 * Used by the AI module to fetch uploaded images for Reckoning inference without
 * going through a presigned URL round-trip.
 *
 * @param key S3 object key.
 * @returns The object's raw bytes.
 * @throws {AppError} 502 when the download fails, 503 when S3 is not configured.
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  assertS3Configured();
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    );
    // Body is a Readable stream in Node.js SDK v3.
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    return Buffer.concat(chunks);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[s3.service] getFileBuffer failed:", error);
    throw new AppError("Failed to retrieve the file from storage.", 502, {
      code: "DOWNLOAD_FAILED",
      cause: error,
    });
  }
}
