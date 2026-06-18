/**
 * Prisma singleton.
 *
 * In dev (especially with `tsx watch`) modules can be re-evaluated, leading
 * to many leaked `PrismaClient` instances and exhausted DB connections.
 * Caching on `globalThis` ensures we keep exactly one client per process.
 */

import { PrismaClient } from "@prisma/client";
import { isDevelopment } from "./env.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Shared Prisma client. Import this rather than instantiating `PrismaClient`
 * yourself anywhere in the codebase.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment
      ? ["query", "info", "warn", "error"]
      : ["error"],
  });

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

/**
 * Disconnect the Prisma client. Call from shutdown hooks.
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log("[prisma] Client disconnected.");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[prisma] Error disconnecting client:", error);
  }
}
