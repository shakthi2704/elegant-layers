import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createAdjustment } from "@/app/(dashboard)/inventory/actions";
import { AdjustmentForm } from "@/components/inventory/adjustment-form";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";


export default async function NewAdjustmentPage() {
    await requireRole(["ADMIN"]);

    const [ingredients, products] = await Promise.all([
        prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
        prisma.product.findMany({
            where: { isFinishedProduct: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="space-y-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">Inventory adjustment</CardTitle>
                    <CardDescription>
                        Correct a stock number directly — use this for recounts or fixing a mistake
                        from an earlier Purchase or Production entry. Every adjustment is logged with
                        a reason and can&apos;t be edited or deleted afterward.
                    </CardDescription>
                </CardHeader>
            </Card>

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
        </div >
    );
}