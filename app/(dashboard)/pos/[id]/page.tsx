import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { POSTerminal } from "@/components/pos/pos-terminal";
import { DiscardSaleButton } from "@/components/pos/discard-sale-button";
import { VoidSaleButton } from "@/components/pos/void-sale-button";

export default async function SaleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await requireRole(["ADMIN", "CASHIER"]);
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
            items: { include: { product: true } },
            cashier: true,
            voidedBy: true,
        },
    });

    if (!sale) {
        notFound();
    }

    if (sale.status === "HELD") {
        const [products, categories] = await Promise.all([
            prisma.product.findMany({
                where: { status: "ACTIVE" },
                include: { category: true },
                orderBy: { name: "asc" },
            }),
            prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
        ]);

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Editing: {sale.holdLabel || sale.saleNumber}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Held bill — hold again to save changes, or complete to charge.
                        </p>
                    </div>
                    <DiscardSaleButton saleId={sale.id} label={sale.holdLabel || sale.saleNumber} />
                </div>
                <POSTerminal
                    products={products.map((p) => ({
                        id: p.id,
                        name: p.name,
                        sellingPrice: p.sellingPrice.toNumber(),
                        unit: p.unit,
                        categoryId: p.categoryId,
                        categoryName: p.category.name,
                    }))}
                    categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                    existingSale={{
                        id: sale.id,
                        type: sale.type,
                        holdLabel: sale.holdLabel,
                        items: sale.items.map((item) => ({
                            productId: item.productId,
                            name: item.product.name,
                            unitPrice: item.unitPrice.toNumber(),
                            unit: item.product.unit,
                            quantity: item.quantity.toNumber(),
                        })),
                    }}
                />
            </div>
        );
    }

    // COMPLETED or VOID — receipt-style read-only view
    return (
        <div className="max-w-lg space-y-6">
            <div>
                <h1 className="text-xl font-semibold">{sale.saleNumber}</h1>
                <p className="text-sm text-muted-foreground">
                    {sale.type === "DINE_IN" ? "Dine-in" : "Takeaway"} · Rung up by {sale.cashier.name} on{" "}
                    {sale.createdAt.toLocaleString()}
                </p>
            </div>

            {sale.status === "VOID" && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="font-medium text-destructive">Voided</p>
                    <p className="text-sm text-muted-foreground">
                        By {sale.voidedBy?.name} on {sale.voidedAt?.toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm">{sale.voidReason}</p>
                </div>
            )}

            <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                            <th className="px-4 py-2 font-medium">Item</th>
                            <th className="px-4 py-2 font-medium text-right">Qty</th>
                            <th className="px-4 py-2 font-medium text-right">Price</th>
                            <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sale.items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-2">{item.product.name}</td>
                                <td className="px-4 py-2 text-right">{item.quantity.toString()}</td>
                                <td className="px-4 py-2 text-right">{item.unitPrice.toString()}</td>
                                <td className="px-4 py-2 text-right">{item.subtotal.toString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>Rs. {sale.subtotal.toString()}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>Rs. {sale.total.toString()}</span>
                </div>
                {sale.cashReceived && (
                    <>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Cash received</span>
                            <span>Rs. {sale.cashReceived.toString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Change</span>
                            <span>Rs. {sale.changeGiven?.toString()}</span>
                        </div>
                    </>
                )}
            </div>

            {sale.status === "COMPLETED" && user.role === "ADMIN" && (
                <VoidSaleButton saleId={sale.id} saleLabel={sale.saleNumber} />
            )}
        </div>
    );
}