import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log("Testing direct connection...");
  const start = Date.now();
  const res = await prisma.$queryRaw`SELECT 1 as result`;
  console.log(`Success! Result:`, res, `took ${Date.now() - start}ms`);
}

main()
  .catch((err) => {
    console.error("=== CONNECTION FAILED ===");
    console.error(err);
  })
  .finally(() => prisma.$disconnect());
