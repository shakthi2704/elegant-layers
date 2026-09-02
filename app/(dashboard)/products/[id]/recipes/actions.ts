"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { productRecipeSchema } from "@/lib/validations/product-recipe";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    const recipeIds = formData.getAll("recipeId");
    const quantities = formData.getAll("quantity");

    return {
        components: recipeIds.map((recipeId, index) => ({
            recipeId,
            quantity: quantities[index],
        })),
    };
}

export async function saveProductRecipes(
    productId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = productRecipeSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        return { error: "Product not found." };
    }

    if (parsed.data.components.length > 0) {
        const recipeIds = parsed.data.components.map((c) => c.recipeId);
        const recipes = await prisma.recipe.findMany({ where: { id: { in: recipeIds } } });
        if (recipes.length !== new Set(recipeIds).size) {
            return { error: "One or more recipe components could not be found." };
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.productRecipe.deleteMany({ where: { productId } });

        if (parsed.data.components.length > 0) {
            await tx.productRecipe.createMany({
                data: parsed.data.components.map((component) => ({
                    productId,
                    recipeId: component.recipeId,
                    quantity: component.quantity,
                })),
            });
        }
    });

    revalidatePath(`/products/${productId}/recipes`);
    revalidatePath("/production/new");
    revalidatePath("/recipes");
    return { success: true };
}