import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createPurchase } from "@/app/(dashboard)/purchases/actions";
import { PurchaseForm } from "@/components/purchases/purchase-form";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";


export default async function NewPurchasePage() {
    await requireRole(["ADMIN"]);

    const [suppliers, ingredients, products] = await Promise.all([
        prisma.supplier.findMany({ orderBy: { name: "asc" } }),
        prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
        prisma.product.findMany({
            where: { isFinishedProduct: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="space-y-6">
            <Card className="max-w-6xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">Record Purchase</CardTitle>
                    <CardDescription>
                        Recording a purchase increases ingredient or product stock immediately.
                    </CardDescription>
                </CardHeader>
            </Card>


            {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No suppliers yet — add a supplier first before recording a purchase.
                </p>
            ) : ingredients.length === 0 && products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No ingredients or products yet — add one first before recording a purchase.
                </p>
            ) : (
                <PurchaseForm
                    action={createPurchase}
                    suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
                    ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
                    products={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
                />
            )}
        </div>
    );
}