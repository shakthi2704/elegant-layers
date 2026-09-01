import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { saveProductRecipes } from "@/app/(dashboard)/products/[id]/recipes/actions";
import { ProductRecipesForm } from "@/components/products/product-recipes-form";

export default async function ProductRecipesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const [product, recipes] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: { productRecipes: { include: { recipe: true } } },
        }),
        prisma.recipe.findMany({ orderBy: { name: "asc" } }),
    ]);

    if (!product || !product.isFinishedProduct) {
        notFound();
    }

    const boundSave = saveProductRecipes.bind(null, product.id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Recipe Setup</h1>
                <p className="text-sm text-muted-foreground">
                    What {product.name} is made of. Production will consume all
                    attached components (multiplied by the quantity produced) when
                    this product is made.
                </p>
            </div>

            <ProductRecipesForm
                action={boundSave}
                recipes={recipes.map((r) => ({ id: r.id, name: r.name }))}
                defaultComponents={product.productRecipes.map((pr) => ({
                    recipeId: pr.recipeId,
                    quantity: pr.quantity.toString(),
                }))}
            />
        </div>
    );
}