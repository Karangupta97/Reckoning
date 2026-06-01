/**
 * Auth controllers — thin HTTP adapters.
 *
 * Each handler reads the already-validated request body, delegates to the
 * service layer, and shapes the HTTP response. No business logic lives here.
 * Async errors are forwarded to `next` so the global error handler can render
 * them consistently.
 */
import * as authService from "./auth.service.js";
import { AppError } from "../../utils/AppError.js";
/**
 * Build a {@link RequestContext} from the HTTP layer (IP + User-Agent).
 *
 * @param req Express request.
 * @returns The extracted request context for session auditing.
 */
function requestContext(req) {
    const ua = req.headers["user-agent"];
    return {
        ...(req.ip ? { ipAddress: req.ip } : {}),
        ...(typeof ua === "string" ? { userAgent: ua } : {}),
    };
}
/**
 * `POST /api/auth/register` — begin onboarding by issuing an OTP.
 *
 * @returns 201 with `{ message, expiresInMinutes }`.
 */
export async function register(req, res, next) {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
}
/**
 * `POST /api/auth/verify-otp` — verify the OTP and activate the account.
 *
 * @returns 200 with `{ accessToken, refreshToken, user }`.
 */
export async function verifyOtp(req, res, next) {
    try {
        const result = await authService.verifyOtp(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
/**
 * `POST /api/auth/resend-otp` — reissue an OTP for an in-progress signup.
 *
 * @returns 200 with `{ message, expiresInMinutes }`.
 */
export async function resendOtp(req, res, next) {
    try {
        const result = await authService.resendOtp(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
/**
 * `POST /api/auth/login` — authenticate with email + password.
 *
 * @returns 200 with `{ success: true, data: { accessToken, refreshToken,
 *          expiresIn, tokenType, user } }`.
 */
export async function login(req, res, next) {
    try {
        const result = await authService.login(req.body, requestContext(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
/**
 * `POST /api/auth/refresh` — rotate tokens using a valid refresh token.
 *
 * @returns 200 with `{ success: true, data: { accessToken, refreshToken,
 *          expiresIn } }`.
 */
export async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refresh(refreshToken, requestContext(req));
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
/**
 * `POST /api/auth/logout` — revoke the current device's token or all of them.
 *
 * Requires authentication (`requireAuth` populates `req.user`).
 *
 * @returns 200 with `{ success: true, data: { message } }`.
 */
export async function logout(req, res, next) {
    try {
        if (!req.user) {
            throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
        }
        const { refreshToken, allDevices } = req.body;
        const result = await authService.logout({
            userId: req.user.id,
            ...(refreshToken ? { refreshToken } : {}),
            ...(allDevices ? { allDevices } : {}),
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
}
/**
 * `GET /api/auth/me` — return the authenticated user's fresh profile.
 *
 * Requires authentication (`requireAuth` populates `req.user`).
 *
 * @returns 200 with `{ success: true, data: { user } }`.
 */
export async function me(req, res, next) {
    try {
        if (!req.user) {
            throw new AppError("No token provided", 401, { code: "NO_TOKEN" });
        }
        const user = await authService.getMe(req.user.id);
        res.status(200).json({ success: true, data: { user } });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.controller.js.map