import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";

/** Products in this category can be taken from stock for a cake order. */
export const ICING_CATEGORY_NAME = "Icing";

/** Thrown when an icing line can't be used. The message is shown to the user. */
export class CakeOrderStockError extends Error { }

const UNIT_LABELS: Record<string, string> = {
    KG: "kg",
    G: "g",
    L: "L",
    ML: "ml",
    PCS: "pcs",
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const icingRowsSchema = z
    .array(
        z.object({
            productId: z.string().min(1, "Choose an icing"),
            quantity: z.coerce
                .number({ message: "Enter a quantity" })
                .min(0.001, "Quantity must be at least 0.001")
                .max(100000, "That quantity looks too large, please check it")
                .transform(round3),
        })
    )
    .max(20, "Too many icings on one order");

/** Icing to take off stock: [productId, quantity] pairs, merged and sorted. */
export type IcingLines = [string, number][];

/**
 * Reads the icing rows of a cake order form. One FormData entry per row for
 * each field (icingProductId, icingQuantity) so the two lists line up.
 * Blank rows are ignored and the same icing on two rows is added together.
 */
export function parseIcingRows(
    formData: FormData
): { ok: true; lines: IcingLines } | { ok: false; error: string } {
    const productIds = formData.getAll("icingProductId").map(String);
    const quantities = formData.getAll("icingQuantity").map(String);
    if (productIds.length !== quantities.length) {
        return {
            ok: false,
            error: "The icing list was not sent correctly. Please try again.",
        };
    }

    const rows = productIds
        .map((productId, index) => ({
            row: index + 1,
            productId: productId.trim(),
            quantity: quantities[index].trim(),
        }))
        .filter((r) => r.productId !== "" || r.quantity !== "");

    const parsed = icingRowsSchema.safeParse(
        rows.map(({ productId, quantity }) => ({ productId, quantity }))
    );
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const index = issue.path[0];
        const rowNumber = typeof index === "number" ? rows[index]?.row : undefined;
        return {
            ok: false,
            error: rowNumber
                ? `Icing row ${rowNumber}: ${issue.message}`
                : issue.message,
        };
    }

    const needed = new Map<string, number>();
    for (const item of parsed.data) {
        needed.set(
            item.productId,
            round3((needed.get(item.productId) ?? 0) + item.quantity)
        );
    }
    // A fixed order means two people working at once can't block each other.
    const lines: IcingLines = [...needed.entries()].sort(([a], [b]) =>
        a.localeCompare(b)
    );
    return { ok: true, lines };
}

/**
 * Takes icing off stock for a cake order, inside the caller's transaction.
 * Only an active, stock-tracked product in the Icing category is allowed, so
 * a cake can never be used here. Each icing needs enough stock or the whole
 * transaction is refused.
 */
export async function deductIcing(
    tx: Prisma.TransactionClient,
    lines: IcingLines,
    orderId: string,
    userId: string,
    note?: string
) {
    for (const [productId, quantity] of lines) {
        const product = await tx.product.findUnique({
            where: { id: productId },
            select: {
                name: true,
                unit: true,
                status: true,
                isFinishedProduct: true,
                category: { select: { name: true } },
            },
        });
        if (!product) {
            throw new CakeOrderStockError(
                "An icing in the list no longer exists. Remove it and try again."
            );
        }
        if (
            product.status !== "ACTIVE" ||
            !product.isFinishedProduct ||
            product.category.name !== ICING_CATEGORY_NAME
        ) {
            throw new CakeOrderStockError(
                `"${product.name}" can't be used on a cake order. Only active icing products that track stock can be added.`
            );
        }

        // Only deduct if enough is in stock; otherwise nothing happens.
        const result = await tx.product.updateMany({
            where: { id: productId, currentStock: { gte: quantity } },
            data: { currentStock: { decrement: quantity } },
        });
        if (result.count === 0) {
            const current = await tx.product.findUnique({
                where: { id: productId },
                select: { currentStock: true },
            });
            const unit = UNIT_LABELS[product.unit] ?? product.unit;
            throw new CakeOrderStockError(
                `Not enough "${product.name}": ${quantity} ${unit} needed, ${current?.currentStock.toString() ?? "0"} ${unit} in stock.`
            );
        }

        const after = await tx.product.findUniqueOrThrow({
            where: { id: productId },
            select: { currentStock: true },
        });
        await tx.inventoryTransaction.create({
            data: {
                itemType: "PRODUCT",
                productId,
                type: "PRODUCTION_OUT",
                quantity: -quantity,
                balanceAfter: after.currentStock,
                referenceType: "CAKE_ORDER",
                referenceId: orderId,
                note,
                createdById: userId,
            },
        });
    }
}