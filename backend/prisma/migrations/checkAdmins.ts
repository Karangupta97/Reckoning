import { PrismaClient } from "@prisma/client";
import { query, closeDbPool } from "../../src/config/db.js";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== Checking all database tables ===");
  try {
    const res = await query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`
    );
    console.table(res.rows);
  } catch (err: any) {
    console.error("Error fetching tables:", err.message);
  }

  await prisma.$disconnect();
  await closeDbPool();
}

main().catch((e) => { console.error(e); process.exit(1); });
