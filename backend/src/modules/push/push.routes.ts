/**
 * Push subscription management routes.
 *
 * Allows authenticated citizens to register/unregister their browser's
 * push subscription and retrieve the public VAPID key needed to subscribe.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { z } from "zod";

export const pushRouter = Router();

// ─── GET /api/push/vapid-key ────────────────────────────────────────────────
// Public — returns the VAPID public key the browser needs to subscribe.
pushRouter.get("/vapid-key", (_req: Request, res: Response) => {
  if (!env.VAPID_PUBLIC_KEY) {
    res.status(503).json({
      success: false,
      error: { code: "PUSH_NOT_CONFIGURED", message: "Push notifications are not configured." },
    });
    return;
  }
  res.json({ success: true, data: { publicKey: env.VAPID_PUBLIC_KEY } });
});

// ─── Validation schema ──────────────────────────────────────────────────────
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// ─── POST /api/push/subscribe ───────────────────────────────────────────────
// Store the browser's push subscription for the authenticated user.
pushRouter.post(
  "/subscribe",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = subscribeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError("Invalid subscription payload.", 400, { code: "VALIDATION_ERROR" });
      }

      const { endpoint, keys } = parsed.data;
      const userId = req.user!.id;

      // Upsert — a given endpoint belongs to exactly one user/device.
      await prisma.pushSubscription.upsert({
        where: { endpoint },
        create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        update: { userId, p256dh: keys.p256dh, auth: keys.auth },
      });

      res.status(201).json({ success: true, message: "Subscription saved." });
    } catch (error) {
      next(error);
    }
  },
);

// ─── DELETE /api/push/unsubscribe ───────────────────────────────────────────
// Remove a push subscription (user logged out or revoked notifications).
pushRouter.delete(
  "/unsubscribe",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { endpoint } = req.body as { endpoint?: string };
      if (!endpoint) {
        throw new AppError("Missing endpoint.", 400, { code: "VALIDATION_ERROR" });
      }

      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: req.user!.id },
      });

      res.json({ success: true, message: "Subscription removed." });
    } catch (error) {
      next(error);
    }
  },
);
