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
        name: formData.get("name"),
        items: ingredientIds.map((ingredientId, index) => ({
            ingredientId,
            quantity: quantities[index],
        })),
    };
}

export async function createRecipe(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = recipeSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.recipe.findUnique({
        where: { name: parsed.data.name },
    });
    if (existing) {
        return { fieldErrors: { name: ["A recipe component with this name already exists."] } };
    }

    await prisma.recipe.create({
        data: {
            name: parsed.data.name,
            items: {
                create: parsed.data.items.map((item) => ({
                    ingredientId: item.ingredientId,
                    quantity: item.quantity,
                })),
            },
        },
    });

    revalidatePath("/recipes");
    redirect("/recipes");
}

export async function updateRecipe(
    recipeId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = recipeSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.recipe.findUnique({
        where: { name: parsed.data.name },
    });
    if (existing && existing.id !== recipeId) {
        return { fieldErrors: { name: ["A recipe component with this name already exists."] } };
    }

    await prisma.$transaction(async (tx) => {
        await tx.recipe.update({
            where: { id: recipeId },
            data: { name: parsed.data.name },
        });

        await tx.recipeItem.deleteMany({ where: { recipeId } });

        await tx.recipeItem.createMany({
            data: parsed.data.items.map((item) => ({
                recipeId,
                ingredientId: item.ingredientId,
                quantity: item.quantity,
            })),
        });
    });

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${recipeId}/edit`);
    return {};
}

export async function deleteRecipe(recipeId: string): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const usageCount = await prisma.productRecipe.count({ where: { recipeId } });
    if (usageCount > 0) {
        return {
            error: `This recipe component is used by ${usageCount} product${usageCount === 1 ? "" : "s"
                }. Remove it from those products first before deleting.`,
        };
    }

    await prisma.recipe.delete({ where: { id: recipeId } });

    revalidatePath("/recipes");
    return { success: true };
}