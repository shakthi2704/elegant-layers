import { notFound } from "next/navigation";
import Image from "next/image";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { getShopSettings } from "@/lib/settings";
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
                        tracksStock: p.isFinishedProduct,
                        currentStock: p.currentStock.toNumber(),
                        minimumStock: p.minimumStock.toNumber(),
                    }))}
                    categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                    existingSale={{
                        id: sale.id,
                        type: sale.type,
                        holdLabel: sale.holdLabel,
                        discount: sale.discount.toNumber(),
                        complimentaryReason: sale.complimentaryReason,
                        items: sale.items.map((item) => ({
                            productId: item.productId,
                            name: item.product.name,
                            unitPrice: item.unitPrice.toNumber(),
                            unit: item.product.unit,
                            quantity: item.quantity.toNumber(),
                            isComplimentary: item.isComplimentary,
                        })),
                    }}
                />
            </div>
        );
    }

    const shop = await getShopSettings();
    // COMPLETED or VOID — receipt-style read-only view
    // return (
    //     <div className="max-w-lg space-y-6 print:max-w-none print:space-y-2 print:font-mono print:text-[11px]">
    //         <div>
    //             {/* Printed receipts start with the shop details. On screen they
    //                 stay hidden, because staff already know where they are. */}
    //             <div className="mb-2 hidden text-center print:mb-2 print:block print:border-b print:border-dashed print:border-black print:pb-2 print:text-black">
    //                 <p className="text-sm font-bold">{shop.name}</p>
    //                 {shop.address && (
    //                     <p className="whitespace-pre-line text-[10px]">{shop.address}</p>
    //                 )}
    //                 {shop.phone && <p className="text-[10px]">Tel: {shop.phone}</p>}
    //             </div>
    //             <h1 className="text-xl font-semibold print:text-sm print:text-black">
    //                 {sale.saleNumber}
    //             </h1>
    //             <p className="text-sm text-muted-foreground print:text-black">
    //                 {sale.type === "DINE_IN" ? "Dine-in" : "Takeaway"} · Rung up by {sale.cashier.name} on{" "}
    //                 {formatDateTime(sale.createdAt)}
    //             </p>
    //         </div>

    //         {sale.status === "VOID" && (
    //             <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 print:border-black print:bg-white print:p-0">
    //                 <p className="font-medium text-destructive print:text-black">Voided</p>
    //                 <p className="text-sm text-muted-foreground print:text-black">
    //                     By {sale.voidedBy?.name} on{" "}
    //                     {sale.voidedAt ? formatDateTime(sale.voidedAt) : ""}
    //                 </p>
    //                 <p className="mt-2 text-sm print:text-black">{sale.voidReason}</p>
    //             </div>
    //         )}

    //         <div className="overflow-hidden rounded-lg border border-border print:rounded-none print:border-black">
    //             <table className="w-full text-sm print:text-[11px]">
    //                 <thead className="bg-muted/50 text-left text-muted-foreground print:bg-white print:text-black">
    //                     <tr>
    //                         <th className="px-4 py-2 font-medium print:px-1 print:py-1">Item</th>
    //                         <th className="px-4 py-2 font-medium text-right print:px-1 print:py-1">Qty</th>
    //                         <th className="px-4 py-2 font-medium text-right print:px-1 print:py-1">Price</th>
    //                         <th className="px-4 py-2 font-medium text-right print:px-1 print:py-1">Subtotal</th>
    //                     </tr>
    //                 </thead>
    //                 <tbody className="divide-y divide-border print:divide-black">
    //                     {sale.items.map((item) => (
    //                         <tr key={item.id} className="print:text-black">
    //                             <td className="px-4 py-2 print:px-1 print:py-1">
    //                                 {item.product.name}
    //                                 {item.isComplimentary && (
    //                                     <span className="ml-1 text-xs text-muted-foreground print:text-black">
    //                                         (Complimentary)
    //                                     </span>
    //                                 )}
    //                             </td>

    //                             <td className="px-4 py-2 text-right print:px-1 print:py-1">
    //                                 {item.quantity.toString()}
    //                             </td>

    //                             <td className="px-4 py-2 text-right print:px-1 print:py-1">
    //                                 {Number(item.unitPrice).toLocaleString("en-US", {
    //                                     minimumFractionDigits: 2,
    //                                     maximumFractionDigits: 2,
    //                                 })}
    //                             </td>

    //                             <td className="px-4 py-2 text-right print:px-1 print:py-1">
    //                                 {Number(item.subtotal).toLocaleString("en-US", {
    //                                     minimumFractionDigits: 2,
    //                                     maximumFractionDigits: 2,
    //                                 })}
    //                             </td>
    //                         </tr>

    //                     ))}
    //                 </tbody>
    //             </table>
    //         </div>

    //         <div className="space-y-1 text-sm print:text-[11px]">
    //             <div className="flex justify-between">
    //                 <span className="text-muted-foreground print:text-black">
    //                     Subtotal
    //                 </span>
    //                 <span className="print:text-black">
    //                     Rs.{" "}
    //                     {Number(sale.subtotal).toLocaleString("en-US", {
    //                         minimumFractionDigits: 2,
    //                         maximumFractionDigits: 2,
    //                     })}
    //                 </span>
    //             </div>
    //             {Number(sale.discount) > 0 && (
    //                 <div className="flex justify-between">
    //                     <span className="text-muted-foreground print:text-black">
    //                         Discount
    //                     </span>
    //                     <span className="print:text-black">
    //                         (Rs.{" "}
    //                         {Number(sale.discount).toLocaleString("en-US", {
    //                             minimumFractionDigits: 2,
    //                             maximumFractionDigits: 2,
    //                         })}
    //                         )
    //                     </span>
    //                 </div>
    //             )}

    //             <div className="flex justify-between text-lg font-semibold print:text-sm">
    //                 <span className="print:text-black">Total</span>
    //                 <span className="print:text-black">
    //                     Rs.{" "}
    //                     {Number(sale.total).toLocaleString("en-US", {
    //                         minimumFractionDigits: 2,
    //                         maximumFractionDigits: 2,
    //                     })}
    //                 </span>
    //             </div>

    //             {sale.complimentaryReason && (
    //                 <div className="flex justify-between text-muted-foreground print:hidden">
    //                     <span>Complimentary reason</span>
    //                     <span>{sale.complimentaryReason}</span>
    //                 </div>
    //             )}

    //             {sale.cashReceived && (
    //                 <>
    //                     <div className="flex justify-between text-muted-foreground print:text-black">
    //                         <span>Cash received</span>
    //                         <span>
    //                             Rs.{" "}
    //                             {Number(sale.cashReceived).toLocaleString("en-US", {
    //                                 minimumFractionDigits: 2,
    //                                 maximumFractionDigits: 2,
    //                             })}
    //                         </span>
    //                     </div>

    //                     <div className="flex justify-between text-muted-foreground print:text-black">
    //                         <span>Change</span>
    //                         <span>
    //                             Rs.{" "}
    //                             {Number(sale.changeGiven ?? 0).toLocaleString("en-US", {
    //                                 minimumFractionDigits: 2,
    //                                 maximumFractionDigits: 2,
    //                             })}
    //                         </span>
    //                     </div>
    //                 </>
    //             )}
    //         </div>

    //         {shop.billFooter && (
    //             <p className="hidden text-center text-[10px] print:block print:text-black">
    //                 {shop.billFooter}
    //             </p>
    //         )}
    //         <div className="flex gap-2 print:hidden">
    //             <PrintBillButton />
    //             {sale.status === "COMPLETED" && user.role === "ADMIN" && (
    //                 <VoidSaleButton saleId={sale.id} saleLabel={sale.saleNumber} />
    //             )}
    //         </div>
    //     </div>
    // );

    // COMPLETED or VOID — receipt-style read-only view, laid out like the
    // cake order receipt (80mm, black and white).
    const money = (value: number | string) =>
        `Rs. ${Number(value).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    const hasDiscount = Number(sale.discount) > 0;

    return (
        <div className="space-y-4 print:space-y-0">
            <div className="flex max-w-[80mm] flex-wrap items-center justify-between gap-2 print:hidden">
                <h1 className="text-lg font-semibold">{sale.saleNumber}</h1>
                <div className="flex gap-2">
                    <PrintBillButton />
                    {sale.status === "COMPLETED" && user.role === "ADMIN" && (
                        <VoidSaleButton saleId={sale.id} saleLabel={sale.saleNumber} />
                    )}
                </div>
            </div>

            <div className="max-w-[80mm] space-y-3 rounded-lg border bg-white p-4 font-mono text-[11px] text-black shadow-sm print:max-w-none print:space-y-2 print:rounded-none print:border-0 print:px-3 print:py-2 print:shadow-none">
                {/* Shop */}
                <div className="space-y-0.5 text-center">
                    {/* Black-and-white logo, served as is so the dots stay sharp. */}
                    <div className="flex justify-center pb-1">
                        <Image
                            src="/logo/logo-receipt.png"
                            alt={shop.name}
                            width={384}
                            height={396}
                            priority
                            unoptimized
                            className="h-auto w-[24mm] [image-rendering:pixelated]"
                        />
                    </div>
                    <p className="text-sm font-bold">{shop.name}</p>
                    {shop.address && (
                        <p className="whitespace-pre-line">{shop.address}</p>
                    )}
                    {shop.phone && <p>Tel: {shop.phone}</p>}
                </div>

                {/* Document */}
                <div className="space-y-0.5 border-y border-dashed border-black py-2 text-center">
                    <p className="font-bold">RECEIPT</p>
                    <p>Bill #{sale.saleNumber}</p>
                    <p>{formatDateTime(sale.createdAt)}</p>
                </div>

                <div className="space-y-0.5">
                    <p>
                        <span className="font-semibold">Type:</span>{" "}
                        {sale.type === "DINE_IN" ? "Dine-in" : "Takeaway"}
                    </p>
                    <p>
                        <span className="font-semibold">Cashier:</span>{" "}
                        {sale.cashier.name}
                    </p>
                </div>

                {sale.status === "VOID" && (
                    <div className="space-y-0.5 border-2 border-black p-2 text-center">
                        <p className="text-sm font-bold">*** VOIDED ***</p>
                        <p>
                            By {sale.voidedBy?.name} on{" "}
                            {sale.voidedAt ? formatDateTime(sale.voidedAt) : ""}
                        </p>
                        <p>{sale.voidReason}</p>
                    </div>
                )}

                {/* Items */}
                <div className="space-y-2 border-t border-dashed border-black pt-2">
                    {sale.items.map((item) => (
                        <div key={item.id}>
                            <p className="font-semibold">
                                {item.product.name}
                                {item.isComplimentary && " (Complimentary)"}
                            </p>
                            <div className="flex justify-between gap-2">
                                <span>
                                    {item.quantity.toString()} x{" "}
                                    {Number(item.unitPrice).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                                <span>
                                    {item.isComplimentary
                                        ? "FREE"
                                        : Number(item.subtotal).toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 border-t border-dashed border-black pt-2">
                    {hasDiscount && (
                        <>
                            <div className="flex justify-between gap-2">
                                <span>Subtotal</span>
                                <span>{money(sale.subtotal.toString())}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span>Discount</span>
                                <span>- {money(sale.discount.toString())}</span>
                            </div>
                        </>
                    )}

                    <div className="flex justify-between gap-2 border-t border-black pt-1 text-xs font-bold">
                        <span>TOTAL</span>
                        <span>{money(sale.total.toString())}</span>
                    </div>

                    {sale.cashReceived && (
                        <>
                            <div className="flex justify-between gap-2">
                                <span>Cash received</span>
                                <span>{money(sale.cashReceived.toString())}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span>Change</span>
                                <span>{money((sale.changeGiven ?? 0).toString())}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* The reason is for the owner, so it shows on screen only. */}
                {sale.complimentaryReason && (
                    <p className="border-t border-dashed border-black pt-2 print:hidden">
                        <span className="font-semibold">Complimentary reason:</span>{" "}
                        {sale.complimentaryReason}
                    </p>
                )}

                {/* Footer */}
                <div className="border-t border-dashed border-black pt-2 text-center">
                    <p>{shop.billFooter || "Thank you, come again!"}</p>
                </div>
            </div>
        </div>
    );
}
