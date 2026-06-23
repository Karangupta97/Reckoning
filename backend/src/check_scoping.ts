import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== COMPLAINT CMP-1008 ===");
  const complaint = await prisma.complaint.findUnique({
    where: { id: "CMP-1008" },
    select: {
      id: true,
      ticketNumber: true,
      subDistrictId: true,
      districtId: true,
      status: true,
      createdAt: true,
    }
  });
  console.log(JSON.stringify(complaint, null, 2));

  console.log("\n=== SUB_DISTRICT_ADMIN USERS ===");
  const admins = await prisma.adminUser.findMany({
    where: { role: "SUB_DISTRICT_ADMIN" },
    select: {
      id: true,
      email: true,
      fullName: true,
      subDistrictId: true,
      districtId: true,
    }
  });
  console.log(JSON.stringify(admins, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
