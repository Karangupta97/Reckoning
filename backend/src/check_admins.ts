import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      districtId: true,
      subDistrictId: true,
      isActive: true
    }
  });
  console.log("=== ADMIN USERS ===");
  console.log(JSON.stringify(admins, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
