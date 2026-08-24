// prisma.config.ts — Prisma 7+ datasource configuration.
// Prisma 7 removed `url` and `directUrl` from schema.prisma; they must now
// live here instead. This file is ignored by Prisma v6, so it is safe to
// commit and deploy alongside the existing schema.
import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
});
