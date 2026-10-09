import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createRecipe } from "@/app/(dashboard)/recipes/actions";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { Card, CardHeader, CardTitle, } from "@/components/ui/card";


export default async function NewRecipePage() {
    await requireRole(["ADMIN"]);

    const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">Add Recipe Component</CardTitle>
                </CardHeader>
            </Card>
            <RecipeForm
                action={createRecipe}
                ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
                submitLabel="Create Recipe Component"
            />
        </div>
    );
}