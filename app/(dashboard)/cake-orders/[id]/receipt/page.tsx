import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { getShopSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { PrintKotButton } from "@/components/cake-orders/print-kot-button";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    CASH: "Cash",
    BANK_DEPOSIT: "Bank Deposit",
};

function money(value: number) {
    return `Rs. ${value.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

// The customer bill on a narrow receipt printer (80mm), black and white.
// The A4 version is at /cake-orders/[id]/bill.
export default async function CakeOrderReceiptPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN", "CASHIER"]);
    const { id } = await params;

    const order = await prisma.cakeOrder.findUnique({
        where: { id },
        include: { customer: true },
    });

    if (!order) {
        notFound();
    }

    const shop = await getShopSettings();

    const backLink = (
        <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/cake-orders/${order.id}`} />}
        >
            Back to order
        </Button>
    );

    if (order.status === "CANCELLED") {
        return (
            <div className="max-w-2xl space-y-4 px-6">
                <h1 className="text-xl font-semibold">Customer Bill</h1>
                <p className="text-sm text-muted-foreground">
                    This order was cancelled, so no bill can be printed.
                </p>
                {backLink}
            </div>
        );
    }

    if (!order.price) {
        return (
            <div className="max-w-2xl space-y-4 px-6">
                <h1 className="text-xl font-semibold">Customer Bill</h1>
                <p className="text-sm text-muted-foreground">
                    This order has no price yet. Edit the order and set a price
                    before printing a bill.
                </p>
                <div className="flex gap-2">
                    {backLink}
                    <Button
                        nativeButton={false}
                        render={<Link href={`/cake-orders/${order.id}/edit`} />}
                    >
                        Edit order
                    </Button>
                </div>
            </div>
        );
    }

    const price = order.price.toNumber();
    const advance = order.advancePaid ? order.advancePaid.toNumber() : 0;
    const discount = order.discount.toNumber();
    const remaining = price - advance;
    const billNumber = order.id.slice(-8).toUpperCase();

    // The client settles the full balance at handover, so Collected = paid in full.
    const isCollected = order.status === "COLLECTED";
    const documentTitle = isCollected ? "ORDER RECEIPT" : "ORDER BILL";

    return (
        <div className="space-y-4 px-6 print:px-0">
            <div className="flex max-w-[80mm] items-center justify-between print:hidden">
                <h1 className="text-lg font-semibold">
                    {isCollected ? "Receipt (80mm)" : "Bill (80mm)"}
                </h1>
                <div className="flex gap-2">
                    {backLink}
                    <PrintKotButton />
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
                    <p className="font-bold">{documentTitle}</p>
                    <p>Order #{billNumber}</p>
                    <p>Date: {formatDate(new Date())}</p>
                </div>

                {/* Customer and pickup */}
                <div className="space-y-0.5">
                    <p>
                        <span className="font-semibold">Customer:</span>{" "}
                        {order.customer.name}
                    </p>
                    <p>
                        <span className="font-semibold">Phone:</span>{" "}
                        {order.customer.phone}
                    </p>
                    <p>
                        <span className="font-semibold">Pickup:</span>{" "}
                        {formatDate(order.pickupDate)} at {order.pickupTime}
                    </p>
                </div>

                {/* Cake */}
                <div className="space-y-0.5 border-t border-dashed border-black pt-2">
                    <p className="font-semibold">{order.cakeName}</p>
                    {order.shape && <p>Shape: {order.shape}</p>}
                    {order.weight && <p>Weight: {order.weight}</p>}
                    {order.message && <p>Message: &quot;{order.message}&quot;</p>}
                </div>

                {/* Totals */}
                <div className="space-y-1 border-t border-dashed border-black pt-2">
                    <div className="flex justify-between gap-2">
                        <span>{discount > 0 ? "Price" : "Total Price"}</span>
                        <span>{money(discount > 0 ? price + discount : price)}</span>
                    </div>

                    {discount > 0 && (
                        <>
                            <div className="flex justify-between gap-2">
                                <span>
                                    {order.isComplimentary ? "Complimentary" : "Discount"}
                                </span>
                                <span>- {money(discount)}</span>
                            </div>
                            <div className="flex justify-between gap-2 border-t border-black pt-1">
                                <span>Total Price</span>
                                <span>{money(price)}</span>
                            </div>
                        </>
                    )}

                    {advance > 0 && (
                        <div className="flex justify-between gap-2">
                            <span>
                                Advance Paid
                                {order.paymentMethod &&
                                    ` (${PAYMENT_METHOD_LABEL[order.paymentMethod]})`}
                            </span>
                            <span>- {money(advance)}</span>
                        </div>
                    )}

                    {isCollected && remaining > 0 && (
                        <div className="flex justify-between gap-2">
                            <span>Balance Paid on Collection</span>
                            <span>- {money(remaining)}</span>
                        </div>
                    )}

                    <div className="flex justify-between gap-2 border-t border-black pt-1 text-xs font-bold">
                        <span>Balance Due</span>
                        <span>{money(isCollected ? 0 : remaining)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="space-y-0.5 border-t border-dashed border-black pt-2 text-center">
                    {isCollected && <p>Paid in full.</p>}
                    <p>{shop.billFooter || "Thank you for your order!"}</p>
                </div>
            </div>
        </div>
    );
}