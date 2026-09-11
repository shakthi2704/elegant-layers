"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { productionSchema } from "@/lib/validations/production";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    const productIds = formData.getAll("productId");
    const quantities = formData.getAll("quantityProduced");

    return {
        productionDate: formData.get("productionDate"),
        notes: formData.get("notes"),
        items: productIds.map((productId, index) => ({
            productId,
            quantityProduced: quantities[index],
        })),
    };
}

export async function createProduction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = productionSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { productionDate, notes, items } = parsed.data;

    const producedByProduct = new Map<string, number>();
    for (const item of items) {
        producedByProduct.set(
            item.productId,
            (producedByProduct.get(item.productId) ?? 0) + item.quantityProduced
        );
    }

    const productIds = [...producedByProduct.keys()];
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
            productRecipes: {
                include: { recipe: { include: { items: true } } },
            },
            components: {
                include: { componentProduct: true },
            },
        },
    });

    if (products.length !== productIds.length) {
        return { error: "One or more products could not be found." };
    }

    const noRecipesOrComponents = products.find(
        (p) => p.productRecipes.length === 0 && p.components.length === 0
    );
    if (noRecipesOrComponents) {
        return {
            error: `"${noRecipesOrComponents.name}" has no recipe components or base components attached yet — attach at least one in Products first.`,
        };
    }

    const consumptionByIngredient = new Map<string, number>();
    const consumptionByComponentProduct = new Map<string, { name: string; quantity: number }>();

    for (const product of products) {
        const quantityProduced = producedByProduct.get(product.id)!;

        for (const productRecipe of product.productRecipes) {
            const componentMultiplier = productRecipe.quantity.toNumber();

            for (const recipeItem of productRecipe.recipe.items) {
                const needed =
                    recipeItem.quantity.toNumber() * componentMultiplier * quantityProduced;

                consumptionByIngredient.set(
                    recipeItem.ingredientId,
                    (consumptionByIngredient.get(recipeItem.ingredientId) ?? 0) + needed
                );
            }
        }

        for (const component of product.components) {
            const needed = component.quantity.toNumber() * quantityProduced;
            const existing = consumptionByComponentProduct.get(component.componentProductId);

            consumptionByComponentProduct.set(component.componentProductId, {
                name: component.componentProduct.name,
                quantity: (existing?.quantity ?? 0) + needed,
            });
        }
    }

    let productionId: string;

    try {
        productionId = await prisma.$transaction(async (tx) => {
            const production = await tx.production.create({
                data: {
                    productionDate,
                    notes,
                    producedById: user.id,
                    items: {
                        create: [...producedByProduct.entries()].map(
                            ([productId, quantityProduced]) => ({ productId, quantityProduced })
                        ),
                    },
                },
            });

            for (const [ingredientId, quantity] of consumptionByIngredient) {
                const updated = await tx.ingredient.update({
                    where: { id: ingredientId },
                    data: { currentStock: { decrement: quantity } },
                });

                if (updated.currentStock.lessThan(0)) {
                    throw new Error(`INSUFFICIENT_STOCK:INGREDIENT:${updated.name}`);
                }

                await tx.inventoryTransaction.create({
                    data: {
                        itemType: "INGREDIENT",
                        ingredientId,
                        type: "PRODUCTION_OUT",
                        quantity: -quantity,
                        balanceAfter: updated.currentStock,
                        referenceType: "PRODUCTION",
                        referenceId: production.id,
                        createdById: user.id,
                    },
                });
            }

            for (const [componentProductId, { name, quantity }] of consumptionByComponentProduct) {
                const updated = await tx.product.update({
                    where: { id: componentProductId },
                    data: { currentStock: { decrement: quantity } },
                });

                if (updated.currentStock.lessThan(0)) {
                    throw new Error(`INSUFFICIENT_STOCK:COMPONENT:${name}`);
                }

                await tx.inventoryTransaction.create({
                    data: {
                        itemType: "PRODUCT",
                        productId: componentProductId,
                        type: "PRODUCTION_OUT",
                        quantity: -quantity,
                        balanceAfter: updated.currentStock,
                        referenceType: "PRODUCTION",
                        referenceId: production.id,
                        createdById: user.id,
                    },
                });
            }

            for (const [productId, quantityProduced] of producedByProduct) {
                const updated = await tx.product.update({
                    where: { id: productId },
                    data: { currentStock: { increment: quantityProduced } },
                });

                await tx.inventoryTransaction.create({
                    data: {
                        itemType: "PRODUCT",
                        productId,
                        type: "PRODUCTION_IN",
                        quantity: quantityProduced,
                        balanceAfter: updated.currentStock,
                        referenceType: "PRODUCTION",
                        referenceId: production.id,
                        createdById: user.id,
                    },
                });
            }

            return production.id;
        });
    } catch (err) {
        if (err instanceof Error && err.message.startsWith("INSUFFICIENT_STOCK:")) {
            const [, source, name] = err.message.split(":");
            if (source === "COMPONENT") {
                return {
                    error: `Not enough stock of base "${name}" to complete this production run. Produce more of that base first, or reduce the quantity.`,
                };
            }
            return {
                error: `Not enough stock of "${name}" to complete this production run. Record a purchase first, or reduce the quantity.`,
            };
        }
        throw err;
    }

    revalidatePath("/production");
    revalidatePath("/ingredients");
    revalidatePath("/products");
    redirect(`/production/${productionId}`);
}