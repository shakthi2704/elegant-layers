"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import {
    completeSaleSchema,
    holdSaleSchema,
    voidSaleSchema,
} from "@/lib/validations/sale";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseSaleFormData(formData: FormData) {
    const productIds = formData.getAll("productId");
    const quantities = formData.getAll("quantity");
    const unitPrices = formData.getAll("unitPrice");
    const discounts = formData.getAll("discount");
    const freeQuantities = formData.getAll("freeQuantity");

    return {
        type: formData.get("type"),
        holdLabel: formData.get("holdLabel"),
        cashReceived: formData.get("cashReceived"),
        discount: formData.get("billDiscount") || 0,
        complimentaryReason: formData.get("complimentaryReason") || undefined,
        items: productIds.map((productId, index) => ({
            productId,
            quantity: quantities[index],
            unitPrice: unitPrices[index],
            discount: discounts[index] ?? 0,
            freeQuantity: freeQuantities[index] ?? 0,
        })),
    };
}

function calculateTotals(
    items: { quantity: number; unitPrice: number; discount: number }[],
    saleDiscount: number
) {
    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
        0
    );
    return { subtotal, total: subtotal - saleDiscount };
}

type ParsedLine = {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    freeQuantity: number;
};

type SaleRow = {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    isComplimentary: boolean;
};

/**
 * One bill line can hold both paid and free units. It is saved as up to two
 * rows: a paid row, and a complimentary row whose discount equals its full
 * price (so the totals maths stays exactly the same). Stock still moves for
 * both, because the item physically leaves either way.
 */
function expandFreeLines(items: ParsedLine[]): SaleRow[] {
    const rows: SaleRow[] = [];
    for (const item of items) {
        const free = Math.min(item.freeQuantity, item.quantity);
        const paid = Math.round((item.quantity - free) * 1000) / 1000;
        if (paid > 0) {
            rows.push({
                productId: item.productId,
                quantity: paid,
                unitPrice: item.unitPrice,
                discount: item.discount,
                isComplimentary: false,
            });
        }
        if (free > 0) {
            rows.push({
                productId: item.productId,
                quantity: free,
                unitPrice: item.unitPrice,
                discount: Math.round(free * item.unitPrice * 100) / 100,
                isComplimentary: true,
            });
        }
    }
    return rows;
}

async function generateSaleNumber(tx: Prisma.TransactionClient) {
    // Use the highest existing number, not a row count: discarding a held
    // bill deletes its row, so count + 1 can land on a number already taken.
    const last = await tx.sale.findFirst({
        orderBy: { saleNumber: "desc" },
        select: { saleNumber: true },
    });
    const lastNumber = last ? parseInt(last.saleNumber.slice(1), 10) || 0 : 0;
    return `S${String(lastNumber + 1).padStart(5, "0")}`;
}

/**
 * Works out what stock/ingredients a set of sale items should move —
 * finished products deduct their own currentStock; made-to-order products
 * (isFinishedProduct: false) deduct their Recipe's ingredients instead,
 * combined across every item in the sale that shares an ingredient (same
 * combined-consumption approach as Production).
 *
 * Returns positive magnitudes only — completeSale applies them as
 * decrements, voidSale applies the same list as increments.
 */
type StockEffect =
    | { itemType: "PRODUCT"; productId: string; name: string; unit: string; quantity: number }
    | { itemType: "INGREDIENT"; ingredientId: string; name: string; unit: string; quantity: number };

async function computeSaleStockEffects(
    tx: Prisma.TransactionClient,
    items: { productId: string; quantity: number }[]
): Promise<StockEffect[]> {
    const effects = new Map<string, StockEffect>();

    for (const item of items) {
        const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
                productRecipes: {
                    include: { recipe: { include: { items: { include: { ingredient: true } } } } },
                },
            },
        });
        if (!product) {
            throw new Error("One of the items in this bill no longer exists.");
        }

        if (product.isFinishedProduct) {
            const key = `PRODUCT:${product.id}`;
            const existing = effects.get(key);
            effects.set(key, {
                itemType: "PRODUCT",
                productId: product.id,
                name: product.name,
                unit: product.unit,
                quantity: (existing?.quantity ?? 0) + item.quantity,
            });
        } else {
            for (const productRecipe of product.productRecipes) {
                for (const recipeItem of productRecipe.recipe.items) {
                    const requiredQty =
                        recipeItem.quantity.toNumber() *
                        productRecipe.quantity.toNumber() *
                        item.quantity;
                    const key = `INGREDIENT:${recipeItem.ingredientId}`;
                    const existing = effects.get(key);
                    effects.set(key, {
                        itemType: "INGREDIENT",
                        ingredientId: recipeItem.ingredientId,
                        name: recipeItem.ingredient.name,
                        unit: recipeItem.ingredient.unit,
                        quantity: (existing?.quantity ?? 0) + requiredQty,
                    });
                }
            }
        }
    }

    return Array.from(effects.values());
}

export async function holdSale(
    saleId: string | null,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN", "CASHIER"]);

    const parsed = holdSaleSchema.safeParse(parseSaleFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { type, holdLabel, discount, complimentaryReason } = parsed.data;
    const items = expandFreeLines(parsed.data.items);
    if (discount > calculateTotals(items, 0).subtotal + 0.005) {
        return { error: "The discount can't be more than the bill total." };
    }
    // The reason is only saved when something on the bill is free.
    const reasonToSave = items.some((i) => i.isComplimentary)
        ? complimentaryReason?.trim() || null
        : null;
    const { subtotal, total } = calculateTotals(items, discount);

    await prisma.$transaction(async (tx) => {
        if (saleId) {
            const existing = await tx.sale.findUnique({ where: { id: saleId } });
            if (!existing || existing.status !== "HELD") {
                throw new Error("This bill can no longer be edited.");
            }
            await tx.saleItem.deleteMany({ where: { saleId } });
            const sale = await tx.sale.update({
                where: { id: saleId },
                data: {
                    type,
                    holdLabel,
                    subtotal,
                    discount,
                    total,
                    complimentaryReason: reasonToSave,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discount: item.discount,
                            isComplimentary: item.isComplimentary,
                            subtotal: item.quantity * item.unitPrice - item.discount,
                        })),
                    },
                },
            });
            return sale.id;
        }

        const saleNumber = await generateSaleNumber(tx);
        const sale = await tx.sale.create({
            data: {
                saleNumber,
                status: "HELD",
                type,
                holdLabel,
                subtotal,
                discount,
                total,
                complimentaryReason: reasonToSave,
                cashierId: user.id,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        isComplimentary: item.isComplimentary,
                        subtotal: item.quantity * item.unitPrice - item.discount,
                    })),
                },
            },
        });
        return sale.id;
    });

    revalidatePath("/pos");
    redirect("/pos");
}

export async function completeSale(
    saleId: string | null,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN", "CASHIER"]);

    const parsed = completeSaleSchema.safeParse(parseSaleFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { type, discount, cashReceived, complimentaryReason } = parsed.data;
    const items = expandFreeLines(parsed.data.items);
    if (discount > calculateTotals(items, 0).subtotal + 0.005) {
        return { error: "The discount can't be more than the bill total." };
    }
    // Free items need a reason before the bill can be completed.
    const hasFree = items.some((i) => i.isComplimentary);
    if (hasFree && (complimentaryReason?.trim().length ?? 0) < 3) {
        return { error: "Please give a reason for the complimentary items." };
    }
    const reasonToSave = hasFree ? complimentaryReason?.trim() || null : null;
    const { subtotal, total } = calculateTotals(items, discount);

    if (cashReceived < total) {
        return {
            error: `Cash received (Rs. ${cashReceived}) is less than the total (Rs. ${total.toFixed(2)}).`,
        };
    }
    const changeGiven = cashReceived - total;

    let newSaleId: string;
    try {
        newSaleId = await prisma.$transaction(async (tx) => {
            const effects = await computeSaleStockEffects(tx, items);

            for (const effect of effects) {
                if (effect.itemType === "PRODUCT") {
                    const product = await tx.product.findUniqueOrThrow({
                        where: { id: effect.productId },
                    });
                    if (product.currentStock.toNumber() < effect.quantity) {
                        throw new Error(
                            `Not enough stock of "${effect.name}" — only ${product.currentStock} ${effect.unit} left.`
                        );
                    }
                } else {
                    const ingredient = await tx.ingredient.findUniqueOrThrow({
                        where: { id: effect.ingredientId },
                    });
                    if (ingredient.currentStock.toNumber() < effect.quantity) {
                        throw new Error(
                            `Not enough "${effect.name}" to prepare this order — only ${ingredient.currentStock} ${effect.unit} left.`
                        );
                    }
                }
            }

            let sale;
            if (saleId) {
                await tx.saleItem.deleteMany({ where: { saleId } });
                sale = await tx.sale.update({
                    where: { id: saleId },
                    data: {
                        status: "COMPLETED",
                        type,
                        holdLabel: null,
                        subtotal,
                        discount,
                        total,
                        complimentaryReason: reasonToSave,
                        cashReceived,
                        changeGiven,
                        items: {
                            create: items.map((item) => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                discount: item.discount,
                                isComplimentary: item.isComplimentary,
                                subtotal: item.quantity * item.unitPrice - item.discount,
                            })),
                        },
                    },
                });
            } else {
                const saleNumber = await generateSaleNumber(tx);
                sale = await tx.sale.create({
                    data: {
                        saleNumber,
                        status: "COMPLETED",
                        type,
                        subtotal,
                        discount,
                        total,
                        complimentaryReason: reasonToSave,
                        cashReceived,
                        changeGiven,
                        cashierId: user.id,
                        items: {
                            create: items.map((item) => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                discount: item.discount,
                                isComplimentary: item.isComplimentary,
                                subtotal: item.quantity * item.unitPrice - item.discount,
                            })),
                        },
                    },
                });
            }

            for (const effect of effects) {
                if (effect.itemType === "PRODUCT") {
                    const updated = await tx.product.update({
                        where: { id: effect.productId },
                        data: { currentStock: { decrement: effect.quantity } },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            itemType: "PRODUCT",
                            productId: effect.productId,
                            type: "SALE",
                            quantity: -effect.quantity,
                            balanceAfter: updated.currentStock,
                            referenceType: "SALE",
                            referenceId: sale.id,
                            createdById: user.id,
                        },
                    });
                } else {
                    const updated = await tx.ingredient.update({
                        where: { id: effect.ingredientId },
                        data: { currentStock: { decrement: effect.quantity } },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            itemType: "INGREDIENT",
                            ingredientId: effect.ingredientId,
                            type: "SALE",
                            quantity: -effect.quantity,
                            balanceAfter: updated.currentStock,
                            referenceType: "SALE",
                            referenceId: sale.id,
                            createdById: user.id,
                        },
                    });
                }
            }

            return sale.id;
        });
    } catch (err) {
        return {
            error: err instanceof Error ? err.message : "Something went wrong completing this sale.",
        };
    }

    revalidatePath("/pos");
    revalidatePath("/products");
    revalidatePath("/ingredients");
    redirect(`/pos/${newSaleId}`);
}

export async function discardSale(saleId: string): Promise<ActionState> {
    await requireRole(["ADMIN", "CASHIER"]);

    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
        return { error: "Bill not found." };
    }
    if (sale.status !== "HELD") {
        return { error: "Only held bills can be discarded this way. A completed sale needs Void instead." };
    }

    await prisma.sale.delete({ where: { id: saleId } });

    revalidatePath("/pos");
    redirect("/pos");
}

export async function voidSale(
    saleId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = voidSaleSchema.safeParse({ reason: formData.get("reason") });
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
    if (!sale) {
        return { error: "Sale not found." };
    }
    if (sale.status !== "COMPLETED") {
        return {
            error: `This sale is already ${sale.status.toLowerCase()} and can't be voided again.`,
        };
    }

    await prisma.$transaction(async (tx) => {
        const effects = await computeSaleStockEffects(
            tx,
            sale.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity.toNumber(),
            }))
        );

        for (const effect of effects) {
            if (effect.itemType === "PRODUCT") {
                const updated = await tx.product.update({
                    where: { id: effect.productId },
                    data: { currentStock: { increment: effect.quantity } },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        itemType: "PRODUCT",
                        productId: effect.productId,
                        type: "SALE",
                        quantity: effect.quantity,
                        balanceAfter: updated.currentStock,
                        referenceType: "SALE_VOID",
                        referenceId: sale.id,
                        note: parsed.data.reason,
                        createdById: user.id,
                    },
                });
            } else {
                const updated = await tx.ingredient.update({
                    where: { id: effect.ingredientId },
                    data: { currentStock: { increment: effect.quantity } },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        itemType: "INGREDIENT",
                        ingredientId: effect.ingredientId,
                        type: "SALE",
                        quantity: effect.quantity,
                        balanceAfter: updated.currentStock,
                        referenceType: "SALE_VOID",
                        referenceId: sale.id,
                        note: parsed.data.reason,
                        createdById: user.id,
                    },
                });
            }
        }

        await tx.sale.update({
            where: { id: saleId },
            data: {
                status: "VOID",
                voidReason: parsed.data.reason,
                voidedAt: new Date(),
                voidedById: user.id,
            },
        });
    });

    revalidatePath("/pos");
    revalidatePath(`/pos/${saleId}`);
    revalidatePath("/products");
    revalidatePath("/ingredients");
    return { success: true };
}