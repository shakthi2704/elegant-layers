import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createWaste } from "@/app/(dashboard)/inventory/actions";
import { WasteForm } from "@/components/inventory/waste-form";

export default async function NewWastePage() {
    await requireRole(["ADMIN"]);

    const [ingredients, products] = await Promise.all([
        prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
        prisma.product.findMany({
            where: { isFinishedProduct: true },
            orderBy: { name: "asc" },
        }),
    ]);


    const foodIngredients = ingredients.filter((i) => i.kind === "INGREDIENT");
    const supplies = ingredients.filter((i) => i.kind === "SUPPLY");
    return (
        <div className="space-y-6">
            <WasteForm
                action={createWaste}
                supplies={supplies.map((i) => ({
                    id: i.id,
                    name: i.name,
                    unit: i.unit,
                    currentStock: i.currentStock.toNumber(),
                }))}
                ingredients={foodIngredients.map((i) => ({
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