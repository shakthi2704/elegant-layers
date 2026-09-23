import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { POSTerminal } from "@/components/pos/pos-terminal";
import { DiscardSaleButton } from "@/components/pos/discard-sale-button";
import { VoidSaleButton } from "@/components/pos/void-sale-button";
import { PrintBillButton } from "@/components/pos/print-bill-button";

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
        <div className="max-w-lg space-y-6 print:max-w-none print:space-y-2 print:font-mono print:text-[11px]">
            <div>
                <h1 className="text-xl font-semibold print:text-sm print:text-black">
                    {sale.saleNumber}
                </h1>
                <p className="text-sm text-muted-foreground print:text-black">
                    {sale.type === "DINE_IN" ? "Dine-in" : "Takeaway"} · Rung up by {sale.cashier.name} on{" "}
                    {formatDateTime(sale.createdAt)}
                </p>
            </div>

            {sale.status === "VOID" && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 print:border-black print:bg-white print:p-0">
                    <p className="font-medium text-destructive print:text-black">Voided</p>
                    <p className="text-sm text-muted-foreground print:text-black">
                        By {sale.voidedBy?.name} on{" "}
                        {sale.voidedAt ? formatDateTime(sale.voidedAt) : ""}
                    </p>
                    <p className="mt-2 text-sm print:text-black">{sale.voidReason}</p>
                </div>
            )}

            <div className="overflow-hidden rounded-lg border border-border print:rounded-none print:border-black">
                <table className="w-full text-sm print:text-[11px]">
                    <thead className="bg-muted/50 text-left text-muted-foreground print:bg-white print:text-black">
                        <tr>
                            <th className="px-4 py-2 font-medium print:px-1 print:py-1">Item</th>
                            <th className="px-4 py-2 font-medium text-right print:px-1 print:py-1">Qty</th>
                            <th className="px-4 py-2 font-medium text-right print:px-1 print:py-1">Price</th>
                            <th className="px-4 py-2 font-medium text-right print:px-1 print:py-1">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border print:divide-black">
                        {sale.items.map((item) => (
                            <tr key={item.id} className="print:text-black">
                                <td className="px-4 py-2 print:px-1 print:py-1">{item.product.name}</td>
                                <td className="px-4 py-2 text-right print:px-1 print:py-1">
                                    {item.quantity.toString()}
                                </td>
                                <td className="px-4 py-2 text-right print:px-1 print:py-1">
                                    {item.unitPrice.toString()}
                                </td>
                                <td className="px-4 py-2 text-right print:px-1 print:py-1">
                                    {item.subtotal.toString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-1 text-sm print:text-[11px]">
                <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-black">Subtotal</span>
                    <span className="print:text-black">Rs. {sale.subtotal.toString()}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold print:text-sm">
                    <span className="print:text-black">Total</span>
                    <span className="print:text-black">Rs. {sale.total.toString()}</span>
                </div>
                {sale.cashReceived && (
                    <>
                        <div className="flex justify-between text-muted-foreground print:text-black">
                            <span>Cash received</span>
                            <span>Rs. {sale.cashReceived.toString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground print:text-black">
                            <span>Change</span>
                            <span>Rs. {sale.changeGiven?.toString()}</span>
                        </div>
                    </>
                )}
            </div>
            <div className="flex gap-2 print:hidden">
                <PrintBillButton />
                {sale.status === "COMPLETED" && user.role === "ADMIN" && (
                    <VoidSaleButton saleId={sale.id} saleLabel={sale.saleNumber} />
                )}
            </div>
        </div>
    );
}