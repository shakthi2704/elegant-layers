import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createPurchase } from "@/app/(dashboard)/purchases/actions";
import { PurchaseForm } from "@/components/purchases/purchase-form";

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
            <div>
                <h1 className="text-xl font-semibold">Record Purchase</h1>
                <p className="text-sm text-muted-foreground">
                    Recording a purchase increases ingredient or product stock immediately.
                </p>
            </div>

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