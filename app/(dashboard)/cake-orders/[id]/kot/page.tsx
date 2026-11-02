import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import { PrintKotButton } from "@/components/cake-orders/print-kot-button";
import { getShopSettings } from "@/lib/settings";

export default async function CakeOrderKotPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN", "CASHIER"]);
    const { id } = await params;

    const order = await prisma.cakeOrder.findUnique({
        where: { id },
        include: { customer: true, product: true },
    });

    if (!order) {
        notFound();
    }

    const ticketNumber = order.id.slice(-8).toUpperCase();

    return (
        <div className="max-w-sm space-y-4 font-mono text-sm text-foreground print:max-w-none print:bg-white print:px-3 print:py-2 print:text-[12px] print:text-black">
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-lg font-semibold">Kitchen Order Ticket</h1>
                <PrintKotButton />
            </div>

            <div className="space-y-1 border-b border-dashed border-border pb-2 print:border-black">
                <p className="text-center text-base font-bold">KITCHEN TICKET</p>
                <p className="text-center">#{ticketNumber}</p>
            </div>

            <div className="space-y-1">
                <p>
                    <span className="font-semibold">Customer:</span> {order.customer.name}
                </p>
                <p>
                    <span className="font-semibold">Pickup:</span>{" "}
                    <span className="text-base font-bold">
                        {formatDate(order.pickupDate)} at{" "}
                        {order.pickupTime}
                    </span>
                </p>
            </div>

            <div className="space-y-1 border-t border-dashed border-border pt-2 print:border-black">
                <p className="font-semibold">{order.cakeName}</p>
                {order.product && <p>Base product: {order.product.name}</p>}
                {order.shape && <p>Shape: {order.shape}</p>}
                {order.weight && <p>Weight: {order.weight}</p>}
                {order.message && (
                    <p className="text-base font-bold">
                        Message: &quot;{order.message}&quot;
                    </p>
                )}
            </div>

            {order.notes && (
                <div className="border-t border-dashed border-border pt-2 print:border-black">
                    <p className="font-semibold">Notes:</p>
                    <p className="whitespace-pre-wrap">{order.notes}</p>
                </div>
            )}

            <p className="border-t border-dashed border-border pt-2 text-xs opacity-70 print:border-black print:opacity-100">
                Printed {formatDateTime(new Date())}
            </p>
        </div>
    );
}