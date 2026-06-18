/**
 * Shared TypeScript contracts for the auth module.
 *
 * These mirror the request/response shapes of the three onboarding endpoints
 * and are kept free of framework types so they can be reused by services,
 * controllers, and (potentially) a typed API client.
 */

import type { Country } from "@prisma/client";
import type { UserRole } from "../../utils/jwt.js";

/** BIMSTEC country union, sourced from the generated Prisma enum. */
export type CountryEnum = Country;

/** `POST /api/auth/register` request body. */
export interface RegisterInput {
  country: CountryEnum;
  email: string;
  password: string;
  fullName: string;
}

/** `POST /api/auth/verify-otp` request body. */
export interface VerifyOtpInput {
  email: string;
  otp: string;
}

/** `POST /api/auth/resend-otp` request body. */
export interface ResendOtpInput {
  email: string;
}

/** Response for register + resend: never includes the OTP. */
export interface OtpDispatchResult {
  message: string;
  expiresInMinutes: number;
}

/** Public-safe user projection returned after successful verification. */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  country: CountryEnum;
  createdAt: Date;
}

/** Response for a successful OTP verification (account activated). */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

/** Optional client/device metadata captured at login for session auditing. */
export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  timezone?: string;
}

/** Request metadata extracted from the HTTP layer (not from the body). */
export interface RequestContext {
  /** Client IP address, if resolvable. */
  ipAddress?: string;
  /** Raw `User-Agent` header, if present. */
  userAgent?: string;
}

/** `POST /api/auth/login` input (validated body). */
export interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: DeviceInfo;
}

/** Full user projection returned on login / `GET /me`. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  country: CountryEnum;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/** Successful login / refresh token bundle plus user. */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: AuthUser;
}

/** `POST /api/auth/refresh` result (rotated token pair). */
export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** `POST /api/auth/logout` input. */
export interface LogoutInput {
  userId: string;
  refreshToken?: string;
  allDevices?: boolean;
}

/** `PATCH /api/auth/me` input. */
export interface UpdateProfileInput {
  fullName?: string;
  country?: CountryEnum;
}
