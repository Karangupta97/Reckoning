/**
 * Zod schemas for the complaints endpoints.
 *
 * Inputs may arrive as JSON or as `multipart/form-data` (where everything is a
 * string), so numeric/boolean/array fields are coerced defensively. Free-text
 * fields are trimmed and stripped of HTML (see {@link stripHtml}) to neutralise
 * stored-XSS before the value ever reaches the DB or another client.
 */
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { ComplaintStatus, Country, IssueCategory, SeverityLevel, } from "@prisma/client";
/**
 * Remove ALL HTML/markup from a string and decode entities, leaving plain
 * text. Used on every free-text field to prevent stored XSS.
 *
 * @param value Raw user input.
 * @returns Sanitised, tag-free text.
 */
function stripHtml(value) {
    return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: "discard",
    }).trim();
}
/**
 * A trimmed, HTML-stripped string with a max length, optional.
 *
 * @param max Maximum length after trimming.
 * @returns A Zod schema producing clean text or `undefined`.
 */
function cleanText(max) {
    return z
        .string()
        .trim()
        .max(max, `Must be at most ${max} characters.`)
        .transform(stripHtml)
        .optional();
}
/** Coerce a possibly-stringified number (form-data) into a finite number. */
const numberFromInput = z.coerce.number({ message: "Must be a number." });
/** Coerce a possibly-stringified boolean (`"true"`/`"false"`) into a boolean. */
const booleanFromInput = z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true");
/** Latitude in valid WGS84 range. */
const latitudeSchema = numberFromInput
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90.");
/** Longitude in valid WGS84 range. */
const longitudeSchema = numberFromInput
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180.");
/**
 * `mediaIds`: 1–5 non-empty ids. Accepts a real array (JSON), a single string,
 * or a JSON-encoded array string (common with multipart form-data).
 */
const mediaIdsSchema = z
    .preprocess((value) => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("[")) {
            try {
                return JSON.parse(trimmed);
            }
            catch {
                return value;
            }
        }
        return [trimmed];
    }
    return value;
}, z.array(z.string().trim().min(1, "Media id cannot be empty.")))
    .refine((arr) => arr.length >= 1, "At least 1 media file is required.")
    .refine((arr) => arr.length <= 5, "At most 5 media files are allowed.");
/** AI confidence in the inclusive 0–1 range. */
const aiConfidenceSchema = numberFromInput
    .min(0, "aiConfidence must be between 0 and 1.")
    .max(1, "aiConfidence must be between 0 and 1.")
    .optional();
/**
 * `aiRawResult`: an arbitrary object. Accepts a real object (JSON) or a
 * JSON-encoded string (multipart form-data).
 */
const aiRawResultSchema = z
    .preprocess((value) => {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
}, z.record(z.string(), z.unknown()))
    .optional();
/** `POST /api/complaints` body schema. */
export const createComplaintSchema = z.object({
    category: z.nativeEnum(IssueCategory, {
        message: "Invalid issue category.",
    }),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    mediaIds: mediaIdsSchema,
    description: cleanText(1000),
    suggestedFix: cleanText(500),
    roadName: cleanText(200),
    roadNumber: cleanText(50),
    landmark: cleanText(200),
    direction: cleanText(100),
    isAnonymous: booleanFromInput.optional(),
    aiCategory: z.nativeEnum(IssueCategory).optional(),
    aiConfidence: aiConfidenceSchema,
    aiRawResult: aiRawResultSchema,
});
/** `GET /api/complaints` query schema (all optional, sensible defaults). */
export const listComplaintsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.nativeEnum(IssueCategory).optional(),
    status: z.nativeEnum(ComplaintStatus).optional(),
    severity: z.nativeEnum(SeverityLevel).optional(),
    country: z.nativeEnum(Country).optional(),
    lat: latitudeSchema.optional(),
    lng: longitudeSchema.optional(),
    radius: z.coerce.number().min(1).max(50000).default(5000),
    sortBy: z.enum(["createdAt", "severity", "upvotes"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    startDate: z.string().datetime({ message: "startDate must be an ISO date." }).optional(),
    endDate: z.string().datetime({ message: "endDate must be an ISO date." }).optional(),
})
    .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: "lat and lng must be provided together.",
    path: ["lat"],
});
/** `:id` path param schema (cuid-shaped, but kept permissive). */
export const complaintIdParamSchema = z.object({
    id: z.string().trim().min(1, "Complaint id is required."),
});
/** `PATCH /api/complaints/:id` body schema — at least one editable field. */
export const updateComplaintSchema = z
    .object({
    description: cleanText(1000),
    suggestedFix: cleanText(500),
    roadName: cleanText(200),
    roadNumber: cleanText(50),
    landmark: cleanText(200),
    direction: cleanText(100),
    isAnonymous: booleanFromInput.optional(),
})
    .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "Provide at least one field to update.",
});
//# sourceMappingURL=complaint.validation.js.map