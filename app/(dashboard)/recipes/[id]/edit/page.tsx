import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateRecipe } from "@/app/(dashboard)/recipes/actions";
import { RecipeForm } from "@/components/recipes/recipe-form";

export default async function EditRecipePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const [recipe, ingredients] = await Promise.all([
        prisma.recipe.findUnique({ where: { id }, include: { items: true } }),
        prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    ]);

    if (!recipe) {
        notFound();
    }

    const boundUpdate = updateRecipe.bind(null, recipe.id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Edit Recipe Component</h1>
            </div>
            <RecipeForm
                action={boundUpdate}
                ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
                submitLabel="Save Changes"
                defaultValues={{
                    name: recipe.name,
                    items: recipe.items.map((item) => ({
                        ingredientId: item.ingredientId,
                        quantity: item.quantity.toString(),
                    })),
                }}
            />
        </div>
    );
}