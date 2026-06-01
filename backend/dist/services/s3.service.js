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
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, assertS3Configured, getSignedDownloadUrl, MAX_PRESIGN_SECONDS, } from "../config/s3.js";
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
export async function putObject(key, body, contentType) {
    assertS3Configured();
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
            // Long-lived caching: objects are immutable (unique keys per upload).
            CacheControl: "public, max-age=31536000, immutable",
        }));
    }
    catch (error) {
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
export async function resolveMediaUrl(key) {
    return getSignedDownloadUrl(key, MAX_PRESIGN_SECONDS);
}
//# sourceMappingURL=s3.service.js.map