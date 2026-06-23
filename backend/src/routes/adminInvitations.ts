import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  requireAdminAuth,
  requireSuperAdmin,
  requireRole,
} from "../middleware/adminAuth.js";
import { hashPassword } from "../utils/adminAuth.js";
import { getTransporter } from "../services/email.service.js";

const router = Router();

const sendInviteSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["DISTRICT_ADMIN", "SUB_DISTRICT_ADMIN"]),
  districtId: z.string().optional().nullable(),
  subDistrictId: z.string().optional().nullable(),
});

// POST /api/admin/invitations/send
router.post(
  "/send",
  requireAdminAuth,
  async (req: any, res: any) => {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    try {
      const parsed = sendInviteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Validation failed.",
          },
        });
      }

      const { email, role, districtId, subDistrictId } = parsed.data;

      // Role ceiling and authorization checks
      if (req.admin.role === "SUB_DISTRICT_ADMIN") {
        return res.status(403).json({
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Sub-district admins cannot invite anyone.",
          },
        });
      }

      if (role === "DISTRICT_ADMIN") {
        if (req.admin.role !== "SUPER_ADMIN") {
          return res.status(403).json({
            success: false,
            error: {
              code: "INSUFFICIENT_PERMISSIONS",
              message: "Only super admins can invite district admins.",
            },
          });
        }
        if (!districtId) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "District ID must be provided to invite a district admin.",
            },
          });
        }
      }

      if (role === "SUB_DISTRICT_ADMIN") {
        if (req.admin.role !== "SUPER_ADMIN" && req.admin.role !== "DISTRICT_ADMIN") {
          return res.status(403).json({
            success: false,
            error: {
              code: "INSUFFICIENT_PERMISSIONS",
              message: "Only district admins or super admins can invite sub-district admins.",
            },
          });
        }
        if (req.admin.role === "DISTRICT_ADMIN") {
          // Enforce district ceiling: district admin can only invite within their own district
          if (req.admin.districtId !== districtId) {
            return res.status(403).json({
              success: false,
              error: {
                code: "INSUFFICIENT_PERMISSIONS",
                message: "District admins can only invite sub-district admins within their own district.",
              },
            });
          }
        }
        if (!subDistrictId) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Sub-district ID must be provided to invite a sub-district admin.",
            },
          });
        }
      }

      // Check no active invitation already exists for this email
      const existingInvite = await prisma.adminInvitation.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvite) {
        return res.status(409).json({
          success: false,
          error: {
            code: "INVITATION_ALREADY_EXISTS",
            message: "An active invitation already exists for this email address.",
          },
        });
      }

      // Check no active AdminUser already exists for this email
      const existingUser = await prisma.adminUser.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          isActive: true,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: "EMAIL_IN_USE",
            message: "An active administrator user already exists with this email address.",
          },
        });
      }

      // Generate random token (64 bytes hex)
      const token = crypto.randomBytes(64).toString("hex");
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // Store in DB
      const invitation = await prisma.adminInvitation.create({
        data: {
          token,
          email,
          role,
          districtId: districtId || null,
          subDistrictId: subDistrictId || null,
          invitedById: req.admin.sub,
          expiresAt,
        },
      });

      // Send Invitation Email via Nodemailer SMTP
      const transporter = getTransporter();
      const activationUrl = `${env.ADMIN_FRONTEND_URL}/admin/accept-invite?token=${token}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1A3C5E; text-align: center;">RoadWatch AI - Admin Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited to join RoadWatch AI as a <strong>${
            role === "DISTRICT_ADMIN" ? "District Administrator" : "Sub-District Administrator"
          }</strong>.</p>
          <p>To accept this invitation and activate your account, please click the button below to set up your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" style="background-color: #2F80ED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Activate Your Account</a>
          </div>
          <p style="color: #666; font-size: 13px;">Please note that this invitation link is valid for 48 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">RoadWatch AI • Road Safety Hackathon 2026</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
        to: email,
        subject: "RoadWatch AI - Admin Invitation",
        html,
        text: `You have been invited to join RoadWatch AI. Please activate your account at: ${activationUrl}`,
      });

      logger.info("Admin invitation sent successfully", {
        action: "send_invite",
        invitationId: invitation.id,
        email,
        role,
        ip,
      });

      return res.status(200).json({
        success: true,
        data: {
          invitationId: invitation.id,
          email,
          role,
          expiresAt: expiresAt.toISOString(),
        },
      });
    } catch (err) {
      logger.error("Unhandled error during sending invitation", { error: String(err) });
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred.",
        },
      });
    }
  },
);

const acceptInviteSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain at least one number")
      .regex(/(?=.*[@$!%*?&_\-#^()\-+=])/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// POST /api/admin/invitations/accept (Public endpoint)
router.post("/accept", async (req: any, res: any) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  try {
    const parsed = acceptInviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message || "Validation failed.",
        },
      });
    }

    const { token, password } = parsed.data;

    // Find unused and non-expired invitation
    const invitation = await prisma.adminInvitation.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      logger.warn("Admin invitation acceptance failed: Invalid or expired invitation", { ip });
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_OR_EXPIRED_INVITATION",
          message: "The invitation is invalid or has expired.",
        },
      });
    }

    const hashedPassword = await hashPassword(password);

    // Create AdminUser and mark invitation as used in a transaction
    await prisma.$transaction([
      prisma.adminUser.create({
        data: {
          email: invitation.email,
          passwordHash: hashedPassword,
          role: invitation.role,
          districtId: invitation.districtId,
          subDistrictId: invitation.subDistrictId,
          invitedById: invitation.invitedById,
          isActive: true,
        },
      }),
      prisma.adminInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
    ]);

    logger.info("Admin invitation accepted, account created", {
      action: "accept_invite",
      email: invitation.email,
      role: invitation.role,
      ip,
    });

    return res.status(201).json({
      success: true,
      message: "Account created. Please log in.",
    });
  } catch (err) {
    logger.error("Unhandled error during accepting invitation", { error: String(err) });
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

// GET /api/admin/invitations (Super Admin only)
router.get(
  "/",
  requireAdminAuth,
  requireSuperAdmin,
  async (req: any, res: any) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string; // pending | accepted | expired

      const now = new Date();
      let where: any = {};

      if (status === "pending") {
        where.usedAt = null;
        where.expiresAt = { gt: now };
      } else if (status === "accepted") {
        where.usedAt = { not: null };
      } else if (status === "expired") {
        where.usedAt = null;
        where.expiresAt = { lte: now };
      }

      const [total, rows] = await prisma.$transaction([
        prisma.adminInvitation.count({ where }),
        prisma.adminInvitation.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return res.status(200).json({
        success: true,
        data: {
          invitations: rows,
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (err) {
      logger.error("Unhandled error during listing invitations", { error: String(err) });
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred.",
        },
      });
    }
  },
);

// DELETE /api/admin/invitations/:id (Super Admin only)
router.delete(
  "/:id",
  requireAdminAuth,
  requireSuperAdmin,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const invitation = await prisma.adminInvitation.findUnique({
        where: { id },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Invitation not found.",
          },
        });
      }

      // Revoke a pending invitation (set expiresAt = now)
      await prisma.adminInvitation.update({
        where: { id },
        data: { expiresAt: new Date() },
      });

      logger.info("Admin invitation revoked", {
        action: "revoke_invite",
        invitationId: id,
        adminId: req.admin.sub,
      });

      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      logger.error("Unhandled error during revoking invitation", { error: String(err) });
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal server error occurred.",
        },
      });
    }
  },
);

export { router as adminInvitationsRouter };
