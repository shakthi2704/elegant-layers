/**
 * Go-live import, phase 1: fixed assets, ingredients, supplies and opening stock.
 *
 * Safe by default:
 *   - Without --apply it is a DRY RUN and writes nothing.
 *   - With --apply it also needs --expect-host=<part of the database host>, and
 *     refuses to write if the database it is connected to does not match.
 *   - Items that already exist are skipped and left unchanged, so it can be
 *     run again safely.
 *
 * Opening stock is recorded as a stock adjustment (type ADJUSTMENT, reference
 * MANUAL), the same as the Stock Adjustment screen, so it never counts as a
 * purchase and does not touch income, expenses or profit.
 *
 * Usage (the database comes from DATABASE_URL):
 *   pnpm exec tsx scripts/import-phase1.ts
 *   pnpm exec tsx scripts/import-phase1.ts --apply --expect-host=<host part>
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

const COUNT_DATE_LABEL = "16 Nov 2026";
const OPENING_NOTE = `Opening stock (counted ${COUNT_DATE_LABEL})`;

type Unit = "KG" | "G" | "L" | "ML" | "PCS";
type Kind = "INGREDIENT" | "SUPPLY";
type StockRow = { name: string; kind: Kind; unit: Unit; stock: number };
type AssetRow = {
    name: string;
    category: string;
    purchaseDate: string; // YYYY-MM-DD
    cost: number;
    lifeMonths: number;
    notes: string;
};

const UNITS: Unit[] = ["KG", "G", "L", "ML", "PCS"];

const ing = (name: string, unit: Unit, stock: number): StockRow => ({
    name,
    kind: "INGREDIENT",
    unit,
    stock,
});
const sup = (name: string, stock: number): StockRow => ({
    name,
    kind: "SUPPLY",
    unit: "PCS",
    stock,
});

// ---------------------------------------------------------------------------
// Data, from the client's INVENTORY and Values documents (stock counted 16 Nov 2026)
// ---------------------------------------------------------------------------

const INGREDIENTS: StockRow[] = [
    // Main ingredients
    ing("Sugar", "KG", 10),
    ing("Flour", "KG", 10),
    ing("Oil", "L", 3),
    ing("Baking Powder", "G", 100),
    ing("Vanilla Essence", "ML", 500),
    ing("Glucose Syrup", "G", 500),
    ing("Glycerin (28ml bottle)", "PCS", 1),
    ing("Gelatine", "G", 100),
    ing("Coffee Sachet (1.2g)", "PCS", 3),
    ing("Dark Chocolate (Buttons)", "KG", 1),
    ing("White Chocolate (Buttons)", "KG", 1),
    ing("Cocoa Powder", "KG", 1),
    ing("Corn Flour", "KG", 1),
    ing("Icing Sugar", "KG", 1),
    ing("Eggs", "PCS", 60),
    ing("Milk", "L", 1),
    ing("Heavy Cream (Milac)", "L", 1),
    ing("Unsalted Butter", "KG", 5),
    ing("Milk Powder", "G", 400),
    ing("Margarine", "KG", 10),
    ing("Mango (Fresh)", "G", 634),
    ing("Strawberry (Fresh)", "G", 0),
    ing("Coffee Powder", "G", 100),
    ing("Tea Leaves", "G", 500),
    // Decoration and baking extras
    ing("Shortening", "G", 100),
    ing("Tylose Powder", "G", 40),
    ing("Cream of Tartar", "G", 20),
    ing("Luster Dust (Gold)", "PCS", 1),
    ing("Luster Dust (Silver)", "PCS", 1),
    ing("Gold Leaf (Book)", "PCS", 1),
    ing("Gold Leaf (Bottle)", "PCS", 1),
    ing("Edible Pearls Gold (M)", "G", 100),
    ing("Edible Pearls Gold (L)", "G", 100),
    ing("Edible Pearls Gold (S)", "G", 100),
    ing("Edible Pearls White (M)", "G", 100),
    ing("Edible Pearls White (S)", "G", 100),
    ing("Edible Pearls Silver (M)", "G", 100),
    ing("Edible Pearls Silver (L)", "G", 100),
    ing("Colouring Thick (Christmas Red)", "PCS", 1),
    ing("Colouring Thick (Neon Red)", "PCS", 1),
    ing("Colouring Thick (Rose Pink)", "PCS", 1),
    ing("Colouring Thick (Brilliant Blue)", "PCS", 1),
    ing("Colouring Thick (Lemon Yellow)", "PCS", 1),
    ing("Colouring Thick (Velvet)", "PCS", 1),
    ing("Colouring Thick (Royal Purple)", "PCS", 1),
    ing("Colouring Thick (Black)", "PCS", 1),
    ing("Colouring Thick (White)", "PCS", 1),
];

const SUPPLIES: StockRow[] = [
    sup('Cake Board (Square) 12"', 4),
    sup('Cake Board (Square) 10"', 31),
    sup('Cake Board (Square) 8"', 15),
    sup('Cake Board (Square) 6"', 2),
    sup('Cake Board (Round) 6"', 2),
    sup("Cake Slice Board", 3),
    sup('Cake Box (Tall) 12"', 3),
    sup('Cake Box (Tall) 10"', 19),
    sup('Cake Box (Tall) 6"', 3),
    sup('Cake Box (Short) 12"', 0),
    sup('Cake Box (Short) 10"', 18),
    sup('Cake Box (Short) 8"', 10),
    sup('Cake Box (Short) 6"', 80),
    sup("Bento Cake Box", 10),
    sup("Boba Straws (packet)", 1),
    sup("Paper Cups (packet)", 1),
    sup("Flower Wrappers", 8),
    sup("Kebab Sticks (packet)", 1),
    sup("Wires (Sugar Flower) (packet)", 1),
    sup("Flower Tape", 3),
    sup("Toothpicks (packet)", 1),
    sup("Lollipop Stick (packet)", 1),
    sup("Ribbon (Red) (roll)", 1),
    sup("Ribbon (White) (roll)", 1),
    sup("Ribbon (Brown) (roll)", 1),
    sup("Ribbon (Pink) (roll)", 1),
    sup("Ribbon (Black) (roll)", 1),
    sup("Ribbon (Cream) (roll)", 1),
    sup("Ribbon (Gold) (roll)", 1),
    sup("Ribbon (Yellow) (roll)", 1),
    sup('Polyethene Roll 12"', 1),
    sup('Polyethene Roll 6"', 1),
    sup("Candles (White) (packet)", 1),
    sup("Candles (Gold) (packet)", 1),
    sup("Topper (HBD) (S)", 5),
    sup("Topper Balls (Gold) (packet)", 1),
    sup("Topper Balls (Black) (packet)", 0),
    sup("Topper Balls (White) (packet)", 0),
    sup("Polythene Piping Bags (S) (packet)", 1),
    sup("Gloves Box (L)", 1),
    sup("Gloves Box (S)", 1),
    sup("Oil Paper (sheets)", 10),
    sup("Oil Paper (roll)", 1),
    sup("Cupcake Liner (packet)", 1),
    sup("Cling Film (roll)", 1),
    sup("Kitchen Paper Towels (roll)", 2),
    // Added at the client's request
    sup("Sandpaper", 3),
    sup("Oven Cleaner (700ml)", 1),
    sup("Dish Wash (5ltr)", 1),
    sup("Business Cards", 100),
    sup("Logo Stickers (40nos)", 10),
    sup("Garbage Bag (S)", 10),
    sup("Sponge", 2),
    sup('Masking Tape 1"', 1),
    sup("Permanent Marker", 1),
    sup("Pen (Black)", 1),
    sup("Sticky Note", 1),
    sup("Spray Bottle", 1),
];

const CLIENT_NOTE = "Imported at go-live from the client's list. Cost and date as given by the client.";

const ASSETS: AssetRow[] = [
    { name: "Single Tray Deck Oven", category: "Kitchen Equipment", purchaseDate: "2025-04-10", cost: 265000, lifeMonths: 96, notes: CLIENT_NOTE },
    { name: "7 ltr Standing Mixer (Singer)", category: "Kitchen Equipment", purchaseDate: "2026-11-05", cost: 58649, lifeMonths: 60, notes: CLIENT_NOTE },
    { name: "Induction Cooker", category: "Kitchen Equipment", purchaseDate: "2026-08-28", cost: 20200, lifeMonths: 48, notes: CLIENT_NOTE },
    { name: "Bottle Cooler", category: "Refrigeration", purchaseDate: "2025-06-11", cost: 159990, lifeMonths: 96, notes: CLIENT_NOTE },
    { name: "Freezer", category: "Refrigeration", purchaseDate: "2025-06-11", cost: 144990, lifeMonths: 96, notes: CLIENT_NOTE },
    { name: "Display Chiller", category: "Refrigeration", purchaseDate: "2026-08-07", cost: 350000, lifeMonths: 96, notes: CLIENT_NOTE },
    { name: "Laptop", category: "Electronics", purchaseDate: "2026-08-19", cost: 300000, lifeMonths: 48, notes: "Cost from the client. Purchase date is an ESTIMATE (no bill yet): correct it when the bill is found." },
    { name: "KOT Printer (80mm)", category: "Electronics", purchaseDate: "2026-10-06", cost: 10500, lifeMonths: 48, notes: CLIENT_NOTE },
    { name: "Subwoofer", category: "Electronics", purchaseDate: "2026-07-03", cost: 16000, lifeMonths: 48, notes: CLIENT_NOTE },
    { name: "Cashier Table", category: "Furniture", purchaseDate: "2026-07-25", cost: 10000, lifeMonths: 60, notes: CLIENT_NOTE },
];

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const expectHost = args.find((a) => a.startsWith("--expect-host="))?.split("=")[1] ?? "";

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function fail(message: string): never {
    console.error(`\nSTOP: ${message}\n`);
    process.exit(1);
}

function checkData(stock: StockRow[], assets: AssetRow[]) {
    const problems: string[] = [];
    const seen = new Set<string>();
    for (const row of stock) {
        const key = row.name.trim().toLowerCase();
        if (seen.has(key)) problems.push(`Duplicate name: ${row.name}`);
        seen.add(key);
        if (!row.name.trim()) problems.push("A row has no name");
        if (!UNITS.includes(row.unit)) problems.push(`${row.name}: bad unit ${row.unit}`);
        if (!Number.isFinite(row.stock) || row.stock < 0) problems.push(`${row.name}: bad stock ${row.stock}`);
    }
    const now = Date.now();
    for (const a of assets) {
        const d = new Date(`${a.purchaseDate}T00:00:00.000Z`);
        if (Number.isNaN(d.getTime())) problems.push(`${a.name}: bad date ${a.purchaseDate}`);
        else if (d.getTime() > now) problems.push(`${a.name}: purchase date is in the future`);
        if (!(a.cost > 0)) problems.push(`${a.name}: cost must be above 0`);
        if (!Number.isInteger(a.lifeMonths) || a.lifeMonths < 1) problems.push(`${a.name}: bad useful life`);
    }
    return problems;
}

async function main() {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) fail("DATABASE_URL is not set.");
    const url = new URL(rawUrl);
    const hostLabel = `${url.hostname}${url.pathname}`;

    console.log("============================================================");
    console.log(" Elegant Layers: go-live import, phase 1");
    console.log("============================================================");
    console.log(` Database : ${hostLabel}   (credentials hidden)`);
    console.log(` Mode     : ${APPLY ? "APPLY (will write)" : "DRY RUN (writes nothing)"}`);

    const stock = [...INGREDIENTS, ...SUPPLIES];
    const problems = checkData(stock, ASSETS);
    if (problems.length > 0) {
        console.error("\nProblems in the data:");
        for (const p of problems) console.error(` - ${p}`);
        fail("Fix the data above first.");
    }

    const user = await prisma.user.findFirst({
        where: { role: "ADMIN", isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true },
    });
    if (!user) fail("No active ADMIN user in this database. Create one first.");
    console.log(` Recorded as: ${user.email}`);

    // Work out what exists already.
    const stockPlan: { row: StockRow; exists: boolean }[] = [];
    for (const row of stock) {
        const existing = await prisma.ingredient.findFirst({
            where: { name: { equals: row.name, mode: "insensitive" } },
            select: { id: true },
        });
        stockPlan.push({ row, exists: !!existing });
    }
    const assetPlan: { row: AssetRow; exists: boolean }[] = [];
    for (const row of ASSETS) {
        const existing = await prisma.fixedAsset.findFirst({
            where: {
                name: { equals: row.name, mode: "insensitive" },
                purchaseDate: new Date(`${row.purchaseDate}T00:00:00.000Z`),
            },
            select: { id: true },
        });
        assetPlan.push({ row, exists: !!existing });
    }

    const newStock = stockPlan.filter((p) => !p.exists);
    const newAssets = assetPlan.filter((p) => !p.exists);

    console.log("\n Ingredients and supplies");
    for (const p of stockPlan) {
        const tag = p.exists ? "SKIP (already exists, left unchanged)" : "create";
        console.log(
            `  ${tag.padEnd(36)} ${p.row.kind === "SUPPLY" ? "Supply    " : "Ingredient"} ${p.row.name}: ${p.row.stock} ${p.row.unit}`
        );
    }
    console.log("\n Fixed assets");
    for (const p of assetPlan) {
        const tag = p.exists ? "SKIP (already exists)" : "create";
        console.log(
            `  ${tag.padEnd(24)} ${p.row.name}: Rs ${p.row.cost.toLocaleString("en-US")}, bought ${p.row.purchaseDate}, ${p.row.lifeMonths} months`
        );
    }

    const monthly = newAssets.reduce((s, p) => s + p.row.cost / p.row.lifeMonths, 0);
    console.log("\n------------------------------------------------------------");
    console.log(` Ingredients and supplies to create : ${newStock.length} (of ${stock.length})`);
    console.log(` ...with opening stock above zero    : ${newStock.filter((p) => p.row.stock > 0).length}`);
    console.log(` Fixed assets to create              : ${newAssets.length} (of ${ASSETS.length})`);
    console.log(` Depreciation these assets will add  : about Rs ${Math.round(monthly).toLocaleString("en-US")} a month`);
    console.log("------------------------------------------------------------");

    if (!APPLY) {
        console.log("\nDRY RUN finished. Nothing was written.");
        console.log("To write: run again with  --apply --expect-host=<part of the host above>\n");
        return;
    }

    if (!expectHost) fail("--apply needs --expect-host=<part of the database host>, so a wrong database is caught.");
    if (!url.hostname.includes(expectHost)) {
        fail(`The database host "${url.hostname}" does not contain "${expectHost}". Nothing was written.`);
    }

    console.log("\nWriting...");
    const createdNames: string[] = [];
    for (const { row } of newStock) {
        await prisma.$transaction(async (tx) => {
            const created = await tx.ingredient.create({
                data: {
                    name: row.name,
                    unit: row.unit,
                    kind: row.kind,
                    currentStock: row.stock,
                    minimumStock: 0,
                },
            });
            if (row.stock > 0) {
                await tx.inventoryTransaction.create({
                    data: {
                        itemType: "INGREDIENT",
                        ingredientId: created.id,
                        type: "ADJUSTMENT",
                        quantity: row.stock,
                        balanceAfter: row.stock,
                        referenceType: "MANUAL",
                        note: OPENING_NOTE,
                        createdById: user.id,
                    },
                });
            }
        });
        createdNames.push(row.name);
    }
    for (const { row } of newAssets) {
        await prisma.fixedAsset.create({
            data: {
                name: row.name,
                category: row.category,
                purchaseDate: new Date(`${row.purchaseDate}T00:00:00.000Z`),
                purchaseCost: row.cost,
                salvageValue: 0,
                usefulLifeMonths: row.lifeMonths,
                notes: row.notes,
                createdById: user.id,
            },
        });
    }
    console.log(` Created ${createdNames.length} ingredients and supplies, ${newAssets.length} fixed assets.`);

    // After-check: every new item's stock must equal the sum of its movements.
    const check = await prisma.ingredient.findMany({
        where: { name: { in: createdNames } },
        include: { inventoryTxns: { select: { quantity: true } } },
    });
    const bad = check.filter((i) => {
        const sum = round3(i.inventoryTxns.reduce((s, t) => s + t.quantity.toNumber(), 0));
        return sum !== round3(i.currentStock.toNumber());
    });
    console.log(` After-check: ${check.length} items read back, ${bad.length} where stock and movements disagree.`);
    if (bad.length > 0) {
        for (const i of bad) console.error(`   MISMATCH: ${i.name}`);
        fail("Stock and movements do not agree. Investigate before using the system.");
    }
    console.log("\nDone.\n");
}

main()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });