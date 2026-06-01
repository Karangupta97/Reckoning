/**
 * Pure helpers for the complaints module.
 *
 * No DB or framework access here — just deterministic logic for:
 *   - ticket-number formatting,
 *   - severity heuristics (AI confidence + urgent-keyword scan),
 *   - geospatial sanity checks against BIMSTEC country bounds.
 *
 * Keeping these pure makes them trivial to reason about and reuse.
 */
import { isoCodeForCountry } from "../../services/geocode.service.js";
/** Width of the zero-padded sequence segment in a ticket number. */
const SEQUENCE_PAD = 6;
/**
 * Format a ticket number: `RW-{ISO}-{YEAR}-{PADDED_SEQ}`.
 *
 * @param country Reporter/complaint country (mapped to its ISO code).
 * @param year    Four-digit year.
 * @param seq     Monotonic per-(country, year) sequence number.
 * @returns e.g. `"RW-IN-2026-000042"`.
 */
export function formatTicketNumber(country, year, seq) {
    const iso = isoCodeForCountry(country);
    return `RW-${iso}-${year}-${String(seq).padStart(SEQUENCE_PAD, "0")}`;
}
/** Categories whose high-confidence AI detection implies critical severity. */
const CRITICAL_CATEGORIES = new Set([
    "POTHOLE",
    "CRACKS_DAMAGE",
]);
/** Words that bump severity to at least HIGH when found in free text. */
const URGENT_KEYWORDS = [
    "accident",
    "dangerous",
    "immediate",
    "fatal",
    "injury",
    "emergency",
    "urgent",
    "death",
];
/** Severity ordering used to take the maximum of two levels. */
const SEVERITY_RANK = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
};
/**
 * Return the higher of two severity levels.
 *
 * @param a First severity.
 * @param b Second severity.
 * @returns Whichever ranks higher.
 */
function maxSeverity(a, b) {
    return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}
/**
 * Derive a severity level from AI confidence, category, and urgent keywords.
 *
 * Rules:
 *   - AI confidence > 0.85 on a pothole/cracks report → CRITICAL.
 *   - AI confidence > 0.85 on any other category      → HIGH.
 *   - AI confidence 0.5–0.85                           → MEDIUM.
 *   - AI confidence < 0.5                              → LOW.
 *   - No AI confidence                                 → MEDIUM (default).
 *   - Urgent keyword in text → bumped to at least HIGH (never lowers).
 *
 * @param inputs Category, optional AI confidence, and free-text fields.
 * @returns The computed {@link SeverityLevel}.
 */
export function computeSeverity(inputs) {
    const { category, aiConfidence, description, suggestedFix } = inputs;
    let base;
    if (typeof aiConfidence === "number") {
        if (aiConfidence > 0.85) {
            base = CRITICAL_CATEGORIES.has(category) ? "CRITICAL" : "HIGH";
        }
        else if (aiConfidence >= 0.5) {
            base = "MEDIUM";
        }
        else {
            base = "LOW";
        }
    }
    else {
        base = "MEDIUM";
    }
    const text = `${description ?? ""} ${suggestedFix ?? ""}`.toLowerCase();
    const hasUrgent = URGENT_KEYWORDS.some((word) => text.includes(word));
    return hasUrgent ? maxSeverity(base, "HIGH") : base;
}
/**
 * Approximate bounding boxes for BIMSTEC member states. Used as a cheap,
 * dependency-free guard to reject obviously-bogus coordinates (e.g. `(0,0)`)
 * before doing any expensive work. Boxes are intentionally generous; precise
 * containment is handled by PostGIS authority boundaries.
 */
const COUNTRY_BOUNDS = {
    INDIA: { minLat: 6.5, maxLat: 35.7, minLng: 68.0, maxLng: 97.5 },
    BANGLADESH: { minLat: 20.5, maxLat: 26.7, minLng: 88.0, maxLng: 92.7 },
    NEPAL: { minLat: 26.3, maxLat: 30.5, minLng: 80.0, maxLng: 88.3 },
    SRI_LANKA: { minLat: 5.8, maxLat: 9.9, minLng: 79.6, maxLng: 81.9 },
    MYANMAR: { minLat: 9.5, maxLat: 28.6, minLng: 92.1, maxLng: 101.2 },
    THAILAND: { minLat: 5.5, maxLat: 20.5, minLng: 97.3, maxLng: 105.7 },
    BHUTAN: { minLat: 26.7, maxLat: 28.4, minLng: 88.7, maxLng: 92.2 },
};
/** Combined BIMSTEC bounding box (union of all member states). */
const BIMSTEC_BOUNDS = {
    minLat: 5.5,
    maxLat: 35.7,
    minLng: 68.0,
    maxLng: 105.7,
};
/** Tolerance (degrees) around the null island `(0,0)` that is always rejected. */
const NULL_ISLAND_EPSILON = 0.01;
/**
 * Validate that a coordinate is plausible and inside the BIMSTEC region.
 *
 * Rejects the null island `(0,0)` and points outside the combined BIMSTEC
 * bounding box. (Per-country precision is enforced separately once the
 * geocoded country is known.)
 *
 * @param latitude  Latitude in decimal degrees.
 * @param longitude Longitude in decimal degrees.
 * @returns `{ ok: true }` when plausible, else `{ ok: false, reason }`.
 */
export function validateCoordinates(latitude, longitude) {
    if (Math.abs(latitude) < NULL_ISLAND_EPSILON &&
        Math.abs(longitude) < NULL_ISLAND_EPSILON) {
        return { ok: false, reason: "Coordinates (0,0) are not a valid location." };
    }
    if (latitude < BIMSTEC_BOUNDS.minLat ||
        latitude > BIMSTEC_BOUNDS.maxLat ||
        longitude < BIMSTEC_BOUNDS.minLng ||
        longitude > BIMSTEC_BOUNDS.maxLng) {
        return {
            ok: false,
            reason: "Coordinates are outside the supported BIMSTEC region.",
        };
    }
    return { ok: true };
}
/**
 * Check whether a coordinate falls within a specific country's bounding box.
 *
 * @param country   Country to test against.
 * @param latitude  Latitude in decimal degrees.
 * @param longitude Longitude in decimal degrees.
 * @returns `true` when the point is inside the (generous) country box.
 */
export function isWithinCountryBounds(country, latitude, longitude) {
    const box = COUNTRY_BOUNDS[country];
    return (latitude >= box.minLat &&
        latitude <= box.maxLat &&
        longitude >= box.minLng &&
        longitude <= box.maxLng);
}
/**
 * Assemble a single human-readable address line from structured parts when
 * the geocoder did not return a formatted `display_name`.
 *
 * @param parts Ordered address fragments (nullish entries are dropped).
 * @returns A comma-joined address, or `null` when nothing usable is present.
 */
export function composeAddress(parts) {
    const cleaned = parts
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter((p) => p.length > 0);
    return cleaned.length > 0 ? cleaned.join(", ") : null;
}
//# sourceMappingURL=complaint.helpers.js.map