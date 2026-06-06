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
  MAX_PRESIGN_SECONDS,
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
 * Resolve the URL to persist/return for a stored object.
 *
 * Returns a SigV4 presigned S3 URL valid for the maximum AWS lifetime (7 days
 * — see {@link MAX_PRESIGN_SECONDS}).
 *
 * @param key S3 object key.
 * @returns A fetchable presigned URL for the object.
 */
export async function resolveMediaUrl(key: string): Promise<string> {
  return getSignedDownloadUrl(key, MAX_PRESIGN_SECONDS);
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
