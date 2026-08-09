"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { recipeSchema } from "@/lib/validations/recipe";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    const ingredientIds = formData.getAll("ingredientId");
    const quantities = formData.getAll("quantity");

    return {
        productId: formData.get("productId"),
        items: ingredientIds.map((ingredientId, index) => ({
            ingredientId,
            quantity: quantities[index],
        })),
    };
}

export async function saveRecipe(
    productId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = recipeSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    if (parsed.data.productId !== productId) {
        return { error: "Product mismatch. Please reload and try again." };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        return { error: "Product not found." };
    }

    await prisma.$transaction(async (tx) => {
        const recipe = await tx.recipe.upsert({
            where: { productId },
            create: { productId },
            update: {},
        });

        await tx.recipeItem.deleteMany({ where: { recipeId: recipe.id } });

        await tx.recipeItem.createMany({
            data: parsed.data.items.map((item) => ({
                recipeId: recipe.id,
                ingredientId: item.ingredientId,
                quantity: item.quantity,
            })),
        });
    });

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${productId}`);
    redirect("/recipes");
}

export async function deleteRecipe(productId: string): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    await prisma.recipe.deleteMany({ where: { productId } });

    revalidatePath("/recipes");
    return {};
}