import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createRecipe } from "@/app/(dashboard)/recipes/actions";
import { RecipeForm } from "@/components/recipes/recipe-form";

export default async function NewRecipePage() {
    await requireRole(["ADMIN"]);

    const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Add Recipe Component</h1>
            </div>
            <RecipeForm
                action={createRecipe}
                ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
                submitLabel="Create Recipe Component"
            />
        </div>
    );
}