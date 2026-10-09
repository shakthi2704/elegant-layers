import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createProduction } from "@/app/(dashboard)/production/actions";
import { ProductionForm } from "@/components/production/production-form";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default async function NewProductionPage() {
    await requireRole(["ADMIN"]);

    const products = await prisma.product.findMany({
        where: {
            isFinishedProduct: true,
            status: "ACTIVE",
            OR: [{ productRecipes: { some: {} } }, { components: { some: {} } }],
        },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">Record Production</CardTitle>
                    <CardDescription>
                        Consumes ingredients per recipe and/or base products per component, and
                        increases this product&apos;s stock immediately.
                    </CardDescription>
                </CardHeader>
            </Card>

            {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No products have a recipe or a base component attached yet — set one up
                    before recording production.
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