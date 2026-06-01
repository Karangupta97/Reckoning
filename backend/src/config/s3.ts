/**
 * AWS S3 client + low-level object helpers.
 *
 * Initialises a single {@link S3Client} from validated env vars and exposes the
 * bucket name and two convenience operations used across the media pipeline:
 *
 *   - {@link getSignedDownloadUrl} — mint a time-limited SigV4 GET URL.
 *   - {@link deleteS3Object}       — remove an object (cleanup on deletion).
 *
 * AWS configuration is OPTIONAL at boot (so the API runs in environments
 * without object storage). Anything that actually needs S3 calls
 * {@link assertS3Configured} first, which throws a clear, operator-facing
 * {@link AppError} instead of a cryptic SDK failure.
 */

import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";
import { AppError } from "../utils/AppError.js";

/**
 * AWS SigV4 presigned URLs cannot live longer than 7 days. Requests for a
 * longer expiry are clamped to this ceiling.
 */
export const MAX_PRESIGN_SECONDS = 7 * 24 * 60 * 60;

/** S3 bucket name (may be empty string when S3 is not configured). */
export const BUCKET_NAME: string = env.AWS_S3_BUCKET_NAME ?? "";

/**
 * Shared S3 client. Credentials are only attached when both key parts are
 * present; otherwise the SDK's default provider chain is used (useful on
 * EC2/ECS with an instance role).
 */
export const s3Client: S3Client = new S3Client({
  region: env.AWS_REGION,
  ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

/**
 * Ensure S3 is usable before performing an operation that requires it.
 *
 * @throws {AppError} 503 when the bucket name is not configured.
 */
export function assertS3Configured(): void {
  if (!BUCKET_NAME) {
    throw new AppError(
      "File storage is not configured on this server.",
      503,
      { code: "STORAGE_UNAVAILABLE" },
    );
  }
}

/**
 * Generate a time-limited SigV4 signed GET URL for an object.
 *
 * `expiresIn` is clamped to {@link MAX_PRESIGN_SECONDS} (the AWS hard limit).
 *
 * @param key       S3 object key.
 * @param expiresIn Desired lifetime in seconds (clamped to 7 days).
 * @returns A presigned URL valid for the (clamped) lifetime.
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = MAX_PRESIGN_SECONDS,
): Promise<string> {
  assertS3Configured();
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  const safeExpiry = Math.min(Math.max(1, Math.floor(expiresIn)), MAX_PRESIGN_SECONDS);
  return getSignedUrl(s3Client, command, { expiresIn: safeExpiry });
}

/**
 * Delete an object from S3. Used to clean up media when a complaint is removed.
 *
 * @param key S3 object key to delete.
 */
export async function deleteS3Object(key: string): Promise<void> {
  assertS3Configured();
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
  );
}
