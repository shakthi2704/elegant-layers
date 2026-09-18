import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) {
        throw new Error("No ADMIN user found — run scripts/create-users.ts first.");
    }
    const adminId = admin.id;

    let supplier = await prisma.supplier.findFirst();
    if (!supplier) {
        supplier = await prisma.supplier.create({ data: { name: "General Supplier", contact: "N/A" } });
    }

    // ---- Ingredients needed for Tea / Coffee / new cake pieces ----
    async function ensureIngredient(name: string, unit: "KG" | "G" | "L" | "ML" | "PCS") {
        return prisma.ingredient.upsert({
            where: { name },
            update: {},
            create: { name, unit },
        });
    }

    const teaLeaves = await ensureIngredient("Tea Leaves", "G");
    const milk = await ensureIngredient("Milk", "ML");
    const coffeePowder = await ensureIngredient("Coffee Powder", "G");
    const flour = await ensureIngredient("Flour", "KG");
    const sugar = await ensureIngredient("Sugar", "KG");
    const eggs = await ensureIngredient("Eggs", "PCS");
    const butter = await ensureIngredient("Butter", "KG");

    // ---- Purchase: top up stock for whichever of these are low/new ----
    const purchaseIngredients = [
        { ingredientId: teaLeaves.id, quantity: 1, unitCost: 1200 },
        { ingredientId: milk.id, quantity: 5000, unitCost: 0.35 },
        { ingredientId: coffeePowder.id, quantity: 1, unitCost: 2000 },
        { ingredientId: flour.id, quantity: 10, unitCost: 220 },
        { ingredientId: sugar.id, quantity: 10, unitCost: 280 },
        { ingredientId: eggs.id, quantity: 60, unitCost: 45 },
        { ingredientId: butter.id, quantity: 5, unitCost: 1500 },
    ];

    await prisma.purchase.create({
        data: {
            supplierId: supplier.id,
            totalAmount: purchaseIngredients.reduce((sum, i) => sum + i.quantity * i.unitCost, 0),
            createdById: adminId,
            items: {
                create: purchaseIngredients.map((i) => ({
                    ingredientId: i.ingredientId,
                    quantity: i.quantity,
                    unitCost: i.unitCost,
                    subtotal: i.quantity * i.unitCost,
                })),
            },
        },
    });

    for (const i of purchaseIngredients) {
        const updated = await prisma.ingredient.update({
            where: { id: i.ingredientId },
            data: { currentStock: { increment: i.quantity } },
        });
        await prisma.inventoryTransaction.create({
            data: {
                itemType: "INGREDIENT",
                ingredientId: i.ingredientId,
                type: "PURCHASE",
                quantity: i.quantity,
                balanceAfter: updated.currentStock,
                referenceType: "PURCHASE",
                createdById: adminId,
            },
        });
    }

    // ---- Recipes ----
    async function ensureRecipe(name: string, items: { ingredientId: string; quantity: number }[]) {
        const existing = await prisma.recipe.findUnique({ where: { name } });
        if (existing) return existing;
        return prisma.recipe.create({
            data: { name, items: { create: items } },
        });
    }

    const teaRecipe = await ensureRecipe("Milk Tea Recipe", [
        { ingredientId: teaLeaves.id, quantity: 5 },
        { ingredientId: milk.id, quantity: 150 },
        { ingredientId: sugar.id, quantity: 0.02 },
    ]);

    const coffeeRecipe = await ensureRecipe("Black Coffee Recipe", [
        { ingredientId: coffeePowder.id, quantity: 8 },
        { ingredientId: sugar.id, quantity: 0.015 },
    ]);

    const cakePieceRecipe = await ensureRecipe("Chocolate Cake Piece Recipe", [
        { ingredientId: flour.id, quantity: 0.08 },
        { ingredientId: sugar.id, quantity: 0.05 },
        { ingredientId: eggs.id, quantity: 1 },
        { ingredientId: butter.id, quantity: 0.03 },
    ]);

    const cakeSliceRecipe = await ensureRecipe("Vanilla Cake Slice Recipe", [
        { ingredientId: flour.id, quantity: 0.06 },
        { ingredientId: sugar.id, quantity: 0.04 },
        { ingredientId: eggs.id, quantity: 1 },
        { ingredientId: butter.id, quantity: 0.02 },
    ]);

    // ---- Categories ----
    async function getCategory(name: string) {
        const category = await prisma.category.findUnique({ where: { name } });
        if (!category) throw new Error(`Category "${name}" not found — check prisma/seed.ts ran.`);
        return category;
    }

    const cakePiecesCat = await getCategory("Cake Pieces");
    const cakeSlicesCat = await getCategory("Cake Slices");
    const teaCat = await getCategory("Tea");
    const coffeeCat = await getCategory("Coffee");
    const softDrinksCat = await getCategory("Soft Drinks");
    const snacksCat = await getCategory("Snacks");

    // ---- Products ----
    async function ensureProduct(data: {
        name: string;
        sku: string;
        categoryId: string;
        sellingPrice: number;
        unit: "KG" | "G" | "L" | "ML" | "PCS";
        isFinishedProduct: boolean;
    }) {
        const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
        if (existing) return existing;
        return prisma.product.create({ data });
    }

    const cakePieceProduct = await ensureProduct({
        name: "Chocolate Cake Piece",
        sku: "CP0001",
        categoryId: cakePiecesCat.id,
        sellingPrice: 350,
        unit: "PCS",
        isFinishedProduct: true,
    });
    const cakeSliceProduct = await ensureProduct({
        name: "Vanilla Cake Slice",
        sku: "CS0001",
        categoryId: cakeSlicesCat.id,
        sellingPrice: 300,
        unit: "PCS",
        isFinishedProduct: true,
    });
    const milkTeaProduct = await ensureProduct({
        name: "Milk Tea",
        sku: "TE0001",
        categoryId: teaCat.id,
        sellingPrice: 150,
        unit: "PCS",
        isFinishedProduct: false,
    });
    const blackCoffeeProduct = await ensureProduct({
        name: "Black Coffee",
        sku: "CF0001",
        categoryId: coffeeCat.id,
        sellingPrice: 200,
        unit: "PCS",
        isFinishedProduct: false,
    });
    const cokeProduct = await ensureProduct({
        name: "Coca-Cola 330ml",
        sku: "SD0001",
        categoryId: softDrinksCat.id,
        sellingPrice: 250,
        unit: "PCS",
        isFinishedProduct: true,
    });
    const cookieProduct = await ensureProduct({
        name: "Chocolate Chip Cookie",
        sku: "SN0001",
        categoryId: snacksCat.id,
        sellingPrice: 180,
        unit: "PCS",
        isFinishedProduct: true,
    });

    // ---- Attach recipes to the relevant products ----
    async function ensureProductRecipe(productId: string, recipeId: string) {
        const existing = await prisma.productRecipe.findUnique({
            where: { productId_recipeId: { productId, recipeId } },
        });
        if (!existing) {
            await prisma.productRecipe.create({ data: { productId, recipeId, quantity: 1 } });
        }
    }

    await ensureProductRecipe(cakePieceProduct.id, cakePieceRecipe.id);
    await ensureProductRecipe(cakeSliceProduct.id, cakeSliceRecipe.id);
    await ensureProductRecipe(milkTeaProduct.id, teaRecipe.id);
    await ensureProductRecipe(blackCoffeeProduct.id, coffeeRecipe.id);

    // ---- Production run: give the two Stocked, recipe-based products real stock ----
    const production = await prisma.production.create({
        data: {
            producedById: adminId,
            items: {
                create: [
                    { productId: cakePieceProduct.id, quantityProduced: 10 },
                    { productId: cakeSliceProduct.id, quantityProduced: 10 },
                ],
            },
        },
    });

    for (const [product, recipe, qty] of [
        [cakePieceProduct, cakePieceRecipe, 10],
        [cakeSliceProduct, cakeSliceRecipe, 10],
    ] as const) {
        const recipeItems = await prisma.recipeItem.findMany({ where: { recipeId: recipe.id } });
        for (const ri of recipeItems) {
            const used = ri.quantity.toNumber() * qty;
            const updated = await prisma.ingredient.update({
                where: { id: ri.ingredientId },
                data: { currentStock: { decrement: used } },
            });
            await prisma.inventoryTransaction.create({
                data: {
                    itemType: "INGREDIENT",
                    ingredientId: ri.ingredientId,
                    type: "PRODUCTION_OUT",
                    quantity: -used,
                    balanceAfter: updated.currentStock,
                    referenceType: "PRODUCTION",
                    referenceId: production.id,
                    createdById: adminId,
                },
            });
        }
        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: { currentStock: { increment: qty } },
        });
        await prisma.inventoryTransaction.create({
            data: {
                itemType: "PRODUCT",
                productId: product.id,
                type: "PRODUCTION_IN",
                quantity: qty,
                balanceAfter: updatedProduct.currentStock,
                referenceType: "PRODUCTION",
                referenceId: production.id,
                createdById: adminId,
            },
        });
    }

    // ---- Stock Adjustment: set starting stock for resale items (no Recipe/Production applies) ----
    async function setResaleStock(productId: string, newStock: number, note: string) {
        const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
        const delta = newStock - product.currentStock.toNumber();
        if (delta === 0) return;
        await prisma.product.update({ where: { id: productId }, data: { currentStock: newStock } });
        await prisma.inventoryTransaction.create({
            data: {
                itemType: "PRODUCT",
                productId,
                type: "ADJUSTMENT",
                quantity: delta,
                balanceAfter: newStock,
                referenceType: "MANUAL",
                note,
                createdById: adminId,
            },
        });
    }

    await setResaleStock(cokeProduct.id, 24, "Initial stock — resale item, bought ready-made");
    await setResaleStock(cookieProduct.id, 30, "Initial stock — resale item, bought ready-made");

    console.log("Demo catalog seeded across all categories.");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });