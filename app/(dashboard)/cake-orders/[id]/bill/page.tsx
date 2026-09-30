import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PrintKotButton } from "@/components/cake-orders/print-kot-button";

// Fill these in once the client provides them. Empty values are not printed.
const SHOP = {
    name: "Elegant Layers",
    address: "",
    phone: "",
};

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

export default async function CakeOrderBillPage({
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
    const remaining = price - advance;
    const billNumber = order.id.slice(-8).toUpperCase();

    // The client settles the full balance at handover, so Collected = paid in full.
    const isCollected = order.status === "COLLECTED";
    const documentTitle = isCollected ? "ORDER RECEIPT" : "ORDER BILL";

    return (
        <div className="space-y-4 px-6 print:px-0">
            {/* A4 page size for this route only (globals.css sets 80mm for receipts). */}
            <style>{`@media print { @page { size: A4; margin: 15mm; } }`}</style>

            <div className="flex max-w-[210mm] items-center justify-between print:hidden">
                <h1 className="text-lg font-semibold">
                    {isCollected ? "Customer Receipt" : "Customer Bill"}
                </h1>
                <div className="flex gap-2">
                    {backLink}
                    <PrintKotButton />
                </div>
            </div>

            <div className="max-w-[210mm] space-y-8 rounded-lg border bg-white p-10 text-sm text-black shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:text-[13px] print:text-black print:shadow-none">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-black pb-4">
                    <div>
                        <h2 className="text-2xl font-bold">{SHOP.name}</h2>
                        {SHOP.address && <p>{SHOP.address}</p>}
                        {SHOP.phone && <p>Tel: {SHOP.phone}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold">{documentTitle}</p>
                        <p>Order #{billNumber}</p>
                        <p>Date: {formatDate(new Date())}</p>
                    </div>
                </div>

                {/* Customer + pickup */}
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase">
                            Customer
                        </p>
                        <p className="font-medium">{order.customer.name}</p>
                        <p>{order.customer.phone}</p>
                    </div>
                    <div className="text-right">
                        <p className="mb-1 text-xs font-semibold uppercase">
                            Pickup
                        </p>
                        <p className="font-medium">
                            {formatDate(order.pickupDate)}
                        </p>
                        <p>{order.pickupTime}</p>
                    </div>
                </div>

                {/* Cake */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase">
                        Order Details
                    </p>
                    <div className="space-y-1 border-y border-black py-3">
                        <p className="text-base font-semibold">
                            {order.cakeName}
                        </p>
                        {order.shape && <p>Shape: {order.shape}</p>}
                        {order.weight && <p>Weight: {order.weight}</p>}
                        {order.message && (
                            <p>Message: &quot;{order.message}&quot;</p>
                        )}
                    </div>
                </div>

                {/* Totals */}
                <div className="ml-auto w-full max-w-xs space-y-2">
                    <div className="flex justify-between">
                        <span>Total Price</span>
                        <span>{money(price)}</span>
                    </div>

                    {advance > 0 && (
                        <div className="flex justify-between">
                            <span>
                                Advance Paid
                                {order.paymentMethod &&
                                    ` (${PAYMENT_METHOD_LABEL[order.paymentMethod]})`}
                            </span>
                            <span>- {money(advance)}</span>
                        </div>
                    )}

                    {isCollected && remaining > 0 && (
                        <div className="flex justify-between">
                            <span>Balance Paid on Collection</span>
                            <span>- {money(remaining)}</span>
                        </div>
                    )}

                    <div className="flex justify-between border-t border-black pt-2 text-base font-bold">
                        <span>Balance Due</span>
                        <span>{money(isCollected ? 0 : remaining)}</span>
                    </div>
                </div>

                <p className="border-t border-black pt-4 text-center text-xs">
                    {isCollected
                        ? "Paid in full. Thank you for your order!"
                        : "Thank you for your order!"}
                </p>
            </div>
        </div>
    );
}