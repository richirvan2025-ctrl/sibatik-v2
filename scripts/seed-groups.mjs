// Seed default user groups: ALL KAPRODI dan ALL KABAG
// Jalankan: node scripts/seed-groups.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultGroups = [
  { name: "ALL KAPRODI", description: "Semua Ketua Program Studi" },
  { name: "ALL KABAG", description: "Semua Kepala Bagian" },
];

async function main() {
  for (const group of defaultGroups) {
    await prisma.userGroup.upsert({
      where: { name: group.name },
      update: {},
      create: group,
    });
    console.log(`Group "${group.name}" siap.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
