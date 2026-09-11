import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
    "Whole Cakes",
    "Cake Pieces",
    "Cake Slices",
    "Tea",
    "Coffee",
    "Soft Drinks",
    "Snacks",
    "Cake Base",
];

async function main() {
    for (let i = 0; i < CATEGORIES.length; i++) {
        await prisma.category.upsert({
            where: { name: CATEGORIES[i] },
            update: { sortOrder: i },
            create: { name: CATEGORIES[i], sortOrder: i },
        });
    }
    console.log(`Seeded ${CATEGORIES.length} categories.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });