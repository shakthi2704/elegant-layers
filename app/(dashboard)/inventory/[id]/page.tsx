import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";

export default async function AdjustmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const adjustment = await prisma.inventoryTransaction.findUnique({
        where: { id },
        include: { ingredient: true, product: true, createdBy: true },
    });

    if (!adjustment || adjustment.type !== "ADJUSTMENT") {
        notFound();
    }

    const item = adjustment.ingredient ?? adjustment.product;
    const quantity = adjustment.quantity.toNumber();
    const previousBalance = adjustment.balanceAfter.toNumber() - quantity;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Adjustment Details</h1>
                <p className="text-sm text-muted-foreground">
                    Recorded by {adjustment.createdBy.name} on{" "}
                    {adjustment.createdAt.toLocaleDateString()}
                </p>
            </div>

            <div className="grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-border p-4">
                <div>
                    <p className="text-sm text-muted-foreground">Item</p>
                    <p className="font-medium">{item?.name}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">
                        {adjustment.itemType === "INGREDIENT" ? "Ingredient" : "Product"}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Previous Stock</p>
                    <p className="font-medium">
                        {previousBalance} {item?.unit}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className={`font-medium ${quantity >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                        {quantity >= 0 ? "+" : ""}
                        {adjustment.quantity.toString()} {item?.unit}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">New Stock</p>
                    <p className="font-medium">
                        {adjustment.balanceAfter.toString()} {item?.unit}
                    </p>
                </div>
            </div>

            <div className="max-w-2xl space-y-1.5">
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="rounded-lg border border-border p-4">{adjustment.note}</p>
            </div>
        </div>
    );
}