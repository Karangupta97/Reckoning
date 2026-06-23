import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AdminJWTPayload {
  sub: string;
  id: string; // compatibility field
  role: "SUPER_ADMIN" | "DISTRICT_ADMIN" | "SUB_DISTRICT_ADMIN";
  email: string;
  districtId?: string | null;
  subDistrictId?: string | null;
  country?: string | null; // compatibility field
}

/**
 * Hash a plain text password using bcrypt with 12 rounds.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/**
 * Verify a plain text password against a bcrypt hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generate an access token signed with ADMIN_JWT_SECRET.
 * Expires in 15 minutes.
 */
export function generateAccessToken(payload: Omit<AdminJWTPayload, "id">): string {
  const claims = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    districtId: payload.districtId ?? null,
    subDistrictId: payload.subDistrictId ?? null,
    country: payload.country ?? null,
  };
  return jwt.sign(claims, env.ADMIN_JWT_SECRET, { expiresIn: "15m" });
}

/**
 * Generate a cryptographically secure 64-byte random hex token.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Compute the SHA-256 hex hash of a raw token.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
