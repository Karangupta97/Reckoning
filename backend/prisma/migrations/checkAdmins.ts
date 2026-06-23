import { PrismaClient } from "@prisma/client";
import { query, closeDbPool } from "../../src/config/db.js";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== Listing all admin users ===");
  const admins = await prisma.adminUser.findMany({
    select: { id: true, email: true, role: true, subDistrictId: true, districtId: true, isActive: true },
  });
  console.table(admins);

  await prisma.$disconnect();
  await closeDbPool();
}

main().catch((e) => { console.error(e); process.exit(1); });
