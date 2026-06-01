/**
 * Upload controller — thin multipart adapter.
 *
 * Reads the multer-parsed files off the request, delegates each to
 * {@link uploadFileToS3}, and shapes the JSON response. No business logic here.
 */
import { AppError } from "../../utils/AppError.js";
import { uploadFileToS3, deleteUploadedFile } from "./upload.service.js";
/** Maximum files accepted in a single multipart request. */
export const MAX_FILES_PER_REQUEST = 5;
/**
 * `POST /api/upload` — process and store 1–5 uploaded files.
 *
 * Files are processed sequentially so a memory-heavy batch (e.g. several large
 * videos) does not run sharp/ffmpeg fully in parallel.
 *
 * @returns 201 with `{ success: true, data: { media: UploadResult[] } }`.
 */
export async function uploadFiles(req, res, next) {
    try {
        if (!req.user) {
            throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
        }
        const files = req.files ?? [];
        if (files.length === 0) {
            throw new AppError("No files provided. Attach 1–5 files.", 400, {
                code: "NO_FILES",
            });
        }
        if (files.length > MAX_FILES_PER_REQUEST) {
            throw new AppError(`Too many files. Maximum is ${MAX_FILES_PER_REQUEST} per request.`, 400, { code: "TOO_MANY_FILES" });
        }
        const media = [];
        for (const file of files) {
            media.push(await uploadFileToS3(file, req.user.id));
        }
        res.status(201).json({ success: true, data: { media } });
    }
    catch (error) {
        next(error);
    }
}
/**
 * `DELETE /api/upload/:mediaId` — remove an unused upload owned by the caller.
 *
 * @returns 200 with `{ success: true, data: { message } }`.
 */
export async function deleteFile(req, res, next) {
    try {
        if (!req.user) {
            throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
        }
        const mediaId = req.params.mediaId;
        if (typeof mediaId !== "string" || mediaId.length === 0) {
            throw new AppError("Media id is required.", 400, { code: "BAD_REQUEST" });
        }
        await deleteUploadedFile(mediaId, req.user.id);
        res.status(200).json({ success: true, data: { message: "Upload deleted." } });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=upload.controller.js.map