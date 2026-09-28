"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { purchaseSchema } from "@/lib/validations/purchase";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    const itemTypes = formData.getAll("itemType");
    const itemIds = formData.getAll("itemId");
    const quantities = formData.getAll("quantity");
    const unitCosts = formData.getAll("unitCost");

    return {
        supplierId: formData.get("supplierId"),
        purchaseDate: formData.get("purchaseDate"),
        items: itemTypes.map((itemType, index) => ({
            itemType,
            itemId: itemIds[index],
            quantity: quantities[index],
            unitCost: unitCosts[index],
        })),
    };
}

export async function createPurchase(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = purchaseSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { supplierId, purchaseDate, items } = parsed.data;

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
        return { error: "Supplier not found." };
    }

    const ingredientIds = items.filter((i) => i.itemType === "INGREDIENT").map((i) => i.itemId);
    const productIds = items.filter((i) => i.itemType === "PRODUCT").map((i) => i.itemId);

    const [ingredients, products] = await Promise.all([
        ingredientIds.length
            ? prisma.ingredient.findMany({ where: { id: { in: ingredientIds } } })
            : Promise.resolve([]),
        productIds.length
            ? prisma.product.findMany({ where: { id: { in: productIds } } })
            : Promise.resolve([]),
    ]);

    if (ingredients.length !== new Set(ingredientIds).size) {
        return { error: "One or more ingredients could not be found." };
    }
    if (products.length !== new Set(productIds).size) {
        return { error: "One or more products could not be found." };
    }

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const purchaseId = await prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.create({
            data: {
                supplierId,
                purchaseDate,
                totalAmount,
                createdById: user.id,
                items: {
                    create: items.map((item) => ({
                        itemType: item.itemType,
                        ingredientId: item.itemType === "INGREDIENT" ? item.itemId : undefined,
                        productId: item.itemType === "PRODUCT" ? item.itemId : undefined,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        subtotal: item.quantity * item.unitCost,
                    })),
                },
            },
        });

        // The same ingredient or product can appear on multiple lines, so stock
        // must be moved cumulatively per item rather than per line, or a later
        // write would overwrite an earlier one's balanceAfter.
        const ingredientTotals = new Map<string, number>();
        const productTotals = new Map<string, number>();
        for (const item of items) {
            const totals = item.itemType === "INGREDIENT" ? ingredientTotals : productTotals;
            totals.set(item.itemId, (totals.get(item.itemId) ?? 0) + item.quantity);
        }

        for (const [ingredientId, quantity] of ingredientTotals) {
            const updated = await tx.ingredient.update({
                where: { id: ingredientId },
                data: { currentStock: { increment: quantity } },
            });

            await tx.inventoryTransaction.create({
                data: {
                    itemType: "INGREDIENT",
                    ingredientId,
                    type: "PURCHASE",
                    quantity,
                    balanceAfter: updated.currentStock,
                    referenceType: "PURCHASE",
                    referenceId: purchase.id,
                    createdById: user.id,
                },
            });
        }

        for (const [productId, quantity] of productTotals) {
            const updated = await tx.product.update({
                where: { id: productId },
                data: { currentStock: { increment: quantity } },
            });

            await tx.inventoryTransaction.create({
                data: {
                    itemType: "PRODUCT",
                    productId,
                    type: "PURCHASE",
                    quantity,
                    balanceAfter: updated.currentStock,
                    referenceType: "PURCHASE",
                    referenceId: purchase.id,
                    createdById: user.id,
                },
            });
        }

        return purchase.id;
    });

    revalidatePath("/purchases");
    revalidatePath("/ingredients");
    revalidatePath("/products");
    redirect(`/purchases/${purchaseId}`);
}