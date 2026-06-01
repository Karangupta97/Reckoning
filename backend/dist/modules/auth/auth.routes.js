/**
 * Auth router — wires the onboarding endpoints together.
 *
 * Each route applies, in order: a per-route rate limiter, Zod body validation,
 * then the thin controller. Mounted by the app under `/api/auth`.
 */
import { Router } from "express";
import * as authController from "./auth.controller.js";
import { loginSchema, logoutSchema, refreshSchema, registerSchema, resendOtpSchema, verifyOtpSchema, } from "./auth.validation.js";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { loginEmailLimiter, loginIpLimiter, logoutLimiter, refreshLimiter, registerLimiter, resendOtpLimiter, verifyOtpLimiter, } from "../../middleware/rateLimiter.js";
/**
 * Express router exposing the auth onboarding endpoints.
 *
 * Mount under the `/api/auth` prefix:
 *
 * ```ts
 * app.use("/api/auth", authRouter);
 * ```
 */
export const authRouter = Router();
authRouter.post("/register", registerLimiter, validate({ body: registerSchema }), authController.register);
authRouter.post("/verify-otp", verifyOtpLimiter, validate({ body: verifyOtpSchema }), authController.verifyOtp);
authRouter.post("/resend-otp", resendOtpLimiter, validate({ body: resendOtpSchema }), authController.resendOtp);
// --- Login / session management -------------------------------------------
// Order matters: broad per-IP limiter first, then the targeted IP+email
// limiter (which reads the parsed body), then validation, then the handler.
authRouter.post("/login", loginIpLimiter, validate({ body: loginSchema }), loginEmailLimiter, authController.login);
authRouter.post("/refresh", refreshLimiter, validate({ body: refreshSchema }), authController.refresh);
authRouter.post("/logout", logoutLimiter, requireAuth, validate({ body: logoutSchema }), authController.logout);
authRouter.get("/me", requireAuth, authController.me);
//# sourceMappingURL=auth.routes.js.map