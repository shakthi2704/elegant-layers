import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { saveRecipe } from "@/app/(dashboard)/recipes/actions";
import { RecipeForm } from "@/components/recipes/recipe-form";

export default async function RecipePage({
    params,
}: {
    params: Promise<{ productId: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { productId } = await params;

    const [product, ingredients] = await Promise.all([
        prisma.product.findUnique({
            where: { id: productId },
            include: { recipe: { include: { items: true } } },
        }),
        prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    ]);

    if (!product || !product.isFinishedProduct) {
        notFound();
    }

    const boundSave = saveRecipe.bind(null, product.id);

    const defaultItems =
        product.recipe?.items.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity.toString(),
        })) ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">
                    {defaultItems.length > 0 ? "Edit Recipe" : "Add Recipe"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Ingredients consumed to produce one {product.unit} of {product.name}.
                </p>
            </div>

            <RecipeForm
                action={boundSave}
                productId={product.id}
                productName={product.name}
                ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
                defaultItems={defaultItems}
            />
        </div>
    );
}