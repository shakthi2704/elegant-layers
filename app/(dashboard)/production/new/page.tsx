import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createProduction } from "@/app/(dashboard)/production/actions";
import { ProductionForm } from "@/components/production/production-form";

export default async function NewProductionPage() {
    await requireRole(["ADMIN"]);

    const products = await prisma.product.findMany({
        where: {
            isFinishedProduct: true,
            status: "ACTIVE",
            recipe: { items: { some: {} } },
        },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Record Production</h1>
                <p className="text-sm text-muted-foreground">
                    Consumes ingredients per recipe and increases product stock immediately.
                </p>
            </div>

            {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No products have a recipe yet — define one in Recipes before recording
                    production.
                </p>
            ) : (
                <ProductionForm
                    action={createProduction}
                    products={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
                />
            )}
        </div>
    );
}