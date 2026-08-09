"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { purchaseSchema } from "@/lib/validations/purchase";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    const ingredientIds = formData.getAll("ingredientId");
    const quantities = formData.getAll("quantity");
    const unitCosts = formData.getAll("unitCost");

    return {
        supplierId: formData.get("supplierId"),
        purchaseDate: formData.get("purchaseDate"),
        items: ingredientIds.map((ingredientId, index) => ({
            ingredientId,
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

    const ingredientIds = items.map((i) => i.ingredientId);
    const ingredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
    });
    if (ingredients.length !== new Set(ingredientIds).size) {
        return { error: "One or more ingredients could not be found." };
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
                        ingredientId: item.ingredientId,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        subtotal: item.quantity * item.unitCost,
                    })),
                },
            },
        });

        // One ingredient can appear on multiple lines, so stock must be moved
        // cumulatively per ingredient rather than per line, or a later write
        // would overwrite an earlier one's balanceAfter.
        const totalsByIngredient = new Map<string, number>();
        for (const item of items) {
            totalsByIngredient.set(
                item.ingredientId,
                (totalsByIngredient.get(item.ingredientId) ?? 0) + item.quantity
            );
        }

        for (const [ingredientId, quantity] of totalsByIngredient) {
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

        return purchase.id;
    });

    revalidatePath("/purchases");
    revalidatePath("/ingredients");
    redirect(`/purchases/${purchaseId}`);
}