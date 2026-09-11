import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { saveProductComponents } from "@/app/(dashboard)/products/[id]/components/actions";
import { ProductComponentsForm } from "@/components/products/product-components-form";

export default async function ProductComponentsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const [product, eligibleBases] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: { components: { include: { componentProduct: true } } },
        }),
        prisma.product.findMany({
            where: {
                id: { not: id },
                status: "ACTIVE",
                components: { none: {} },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    if (!product || !product.isFinishedProduct) {
        notFound();
    }

    const boundSave = saveProductComponents.bind(null, product.id);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Base Setup</h1>
                <p className="text-sm text-muted-foreground">
                    Which base products {product.name} is built from. Production will
                    consume the required stock of each attached base (multiplied by the
                    quantity produced) when this product is made.
                </p>
            </div>

            <ProductComponentsForm
                action={boundSave}
                baseProducts={eligibleBases.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
                defaultComponents={product.components.map((c) => ({
                    componentProductId: c.componentProductId,
                    quantity: c.quantity.toString(),
                }))}
            />
        </div>
    );
}