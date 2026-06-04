import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Work", slug: "work" },
  { name: "Personal", slug: "personal" },
  { name: "Learning", slug: "learning" },
  { name: "Shopping", slug: "shopping" },
  { name: "Other", slug: "other" },
];

async function main() {
  console.log("Seeding categories...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    console.log(`  ✔ ${category.name} (${category.slug})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
