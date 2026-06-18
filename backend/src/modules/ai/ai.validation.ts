/**
 * Reckoning AI module — Zod request validation schemas.
 */

import { z } from "zod";

/** Schema for `POST /api/ai/detect` request body. */
export const detectSchema = z.object({
  fileId: z.string().trim().min(1, "File ID is required."),
});

/** Inferred type from the detect schema. */
export type DetectInput = z.infer<typeof detectSchema>;
