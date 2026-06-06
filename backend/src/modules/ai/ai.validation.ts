/**
 * Reckoning AI module — Zod request validation schemas.
 */

import { z } from "zod";

/** Schema for `POST /api/ai/detect` request body. */
export const detectSchema = z.object({
  fileId: z.string().cuid(),
});

/** Inferred type from the detect schema. */
export type DetectInput = z.infer<typeof detectSchema>;
