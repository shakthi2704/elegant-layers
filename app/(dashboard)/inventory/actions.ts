"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { inventoryAdjustmentSchema } from "@/lib/validations/inventory-adjustment";
import { inventoryWasteSchema } from "@/lib/validations/inventory-waste";
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

class InsufficientStockError extends Error { }

export async function createWaste(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = inventoryWasteSchema.safeParse({
        itemType: formData.get("itemType"),
        itemId: formData.get("itemId"),
        quantity: formData.get("quantity"),
        reason: formData.get("reason"),
        note: formData.get("note") || undefined,
    });
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { itemType, itemId, reason, note } = parsed.data;
    // Stock is stored to 3 decimals.
    const quantity = Math.round(parsed.data.quantity * 1000) / 1000;
    if (quantity <= 0) {
        return { fieldErrors: { quantity: ["Quantity must be greater than 0"] } };
    }

    let itemName: string;
    let currentStock: number;

    if (itemType === "INGREDIENT") {
        const ingredient = await prisma.ingredient.findUnique({
            where: { id: itemId },
        });
        if (!ingredient) {
            return { error: "Ingredient not found." };
        }
        itemName = ingredient.name;
        currentStock = ingredient.currentStock.toNumber();
    } else {
        const product = await prisma.product.findUnique({
            where: { id: itemId },
        });
        if (!product) {
            return { error: "Product not found." };
        }
        if (!product.isFinishedProduct) {
            return {
                error: `"${product.name}" is made to order and has no stock to write off.`,
            };
        }
        itemName = product.name;
        currentStock = product.currentStock.toNumber();
    }

    if (quantity > currentStock) {
        return {
            error: `Only ${currentStock} of "${itemName}" is in stock, so you can't write off ${quantity}.`,
        };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // The stock check sits in the where clause, so two people saving at
            // once can never take the stock below zero.
            let balanceAfter: number;

            if (itemType === "INGREDIENT") {
                const result = await tx.ingredient.updateMany({
                    where: { id: itemId, currentStock: { gte: quantity } },
                    data: { currentStock: { decrement: quantity } },
                });
                if (result.count === 0) {
                    throw new InsufficientStockError();
                }
                const updated = await tx.ingredient.findUniqueOrThrow({
                    where: { id: itemId },
                    select: { currentStock: true },
                });
                balanceAfter = updated.currentStock.toNumber();
            } else {
                const result = await tx.product.updateMany({
                    where: { id: itemId, currentStock: { gte: quantity } },
                    data: { currentStock: { decrement: quantity } },
                });
                if (result.count === 0) {
                    throw new InsufficientStockError();
                }
                const updated = await tx.product.findUniqueOrThrow({
                    where: { id: itemId },
                    select: { currentStock: true },
                });
                balanceAfter = updated.currentStock.toNumber();
            }

            await tx.inventoryTransaction.create({
                data: {
                    itemType,
                    ingredientId: itemType === "INGREDIENT" ? itemId : undefined,
                    productId: itemType === "PRODUCT" ? itemId : undefined,
                    type: "WASTE",
                    quantity: -quantity,
                    balanceAfter,
                    referenceType: "MANUAL",
                    note,
                    wasteReason: reason,
                    createdById: user.id,
                },
            });
        });
    } catch (e) {
        if (e instanceof InsufficientStockError) {
            return {
                error: `Not enough "${itemName}" in stock. Refresh and try again.`,
            };
        }
        throw e;
    }

    revalidatePath("/inventory");
    revalidatePath("/ingredients");
    revalidatePath("/products");
    redirect("/inventory?view=movements");
}