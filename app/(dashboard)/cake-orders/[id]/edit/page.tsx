import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateCakeOrder } from "@/app/(dashboard)/cake-orders/actions";
import { CakeOrderForm } from "@/components/cake-orders/cake-order-form";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default async function EditCakeOrderPage({
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

    // Collected / Cancelled orders are locked: send them back to the detail page.
    if (order.status === "COLLECTED" || order.status === "CANCELLED") {
        redirect(`/cake-orders/${order.id}`);
    }

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { status: "ACTIVE" },
                // keep the currently tied product selectable even if it was deactivated
                ...(order.productId ? [{ id: order.productId }] : []),
            ],
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });

    const boundUpdate = updateCakeOrder.bind(null, order.id);

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">
                        Edit Cake Order
                    </CardTitle>
                    <CardDescription>
                        {order.cakeName} · {order.customer.name}
                    </CardDescription>
                </CardHeader>
            </Card>

            <CakeOrderForm
                action={boundUpdate}
                products={products}
                submitLabel="Save Changes"
                defaultValues={{
                    customerName: order.customer.name,
                    customerPhone: order.customer.phone,
                    productId: order.productId,
                    cakeName: order.cakeName,
                    shape: order.shape,
                    weight: order.weight,
                    message: order.message,
                    imageUrl: order.imageUrl,
                    // stored as UTC midnight, so the ISO date is the date that was entered
                    pickupDate: order.pickupDate.toISOString().slice(0, 10),
                    pickupTime: order.pickupTime,
                    price: order.price?.toString() ?? null,
                    advancePaid: order.advancePaid?.toString() ?? null,
                    paymentMethod: order.paymentMethod,
                    notes: order.notes,
                }}
            />
        </div>
    );
}