import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createAdjustment } from "@/app/(dashboard)/inventory/actions";
import { AdjustmentForm } from "@/components/inventory/adjustment-form";

export default async function NewAdjustmentPage() {
    await requireRole(["ADMIN"]);

    const [ingredients, products] = await Promise.all([
        prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
        prisma.product.findMany({ orderBy: { name: "asc" } }),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Stock Adjustment</h1>
                <p className="text-sm text-muted-foreground">
                    Correct a stock number directly — use this for recounts or fixing a mistake
                    from an earlier Purchase or Production entry. Every adjustment is logged with
                    a reason and can&apos;t be edited or deleted afterward.
                </p>
            </div>
            <AdjustmentForm
                action={createAdjustment}
                ingredients={ingredients.map((i) => ({
                    id: i.id,
                    name: i.name,
                    unit: i.unit,
                    currentStock: i.currentStock.toNumber(),
                }))}
                products={products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    unit: p.unit,
                    currentStock: p.currentStock.toNumber(),
                }))}
            />
        </div>
    );
}