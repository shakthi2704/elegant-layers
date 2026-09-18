"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { inventoryAdjustmentSchema } from "@/lib/validations/inventory-adjustment";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    return {
        itemType: formData.get("itemType"),
        itemId: formData.get("itemId"),
        newStock: formData.get("newStock"),
        note: formData.get("note"),
    };
}

export async function createAdjustment(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = inventoryAdjustmentSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { itemType, itemId, newStock, note } = parsed.data;

    let currentStock: number;
    let itemName: string;

    if (itemType === "INGREDIENT") {
        const ingredient = await prisma.ingredient.findUnique({ where: { id: itemId } });
        if (!ingredient) {
            return { error: "Ingredient not found." };
        }
        currentStock = ingredient.currentStock.toNumber();
        itemName = ingredient.name;
    } else {
        const product = await prisma.product.findUnique({ where: { id: itemId } });
        if (!product) {
            return { error: "Product not found." };
        }
        currentStock = product.currentStock.toNumber();
        itemName = product.name;
    }

    const delta = newStock - currentStock;

    if (delta === 0) {
        return {
            error: `"${itemName}" is already at ${newStock} — nothing to adjust.`,
        };
    }

    const adjustmentId = await prisma.$transaction(async (tx) => {
        if (itemType === "INGREDIENT") {
            await tx.ingredient.update({
                where: { id: itemId },
                data: { currentStock: newStock },
            });
        } else {
            await tx.product.update({
                where: { id: itemId },
                data: { currentStock: newStock },
            });
        }

        const txn = await tx.inventoryTransaction.create({
            data: {
                itemType,
                ingredientId: itemType === "INGREDIENT" ? itemId : undefined,
                productId: itemType === "PRODUCT" ? itemId : undefined,
                type: "ADJUSTMENT",
                quantity: delta,
                balanceAfter: newStock,
                referenceType: "MANUAL",
                note,
                createdById: user.id,
            },
        });

        return txn.id;
    });

    revalidatePath("/inventory");
    revalidatePath("/ingredients");
    revalidatePath("/products");
    redirect(`/inventory/${adjustmentId}`);
}