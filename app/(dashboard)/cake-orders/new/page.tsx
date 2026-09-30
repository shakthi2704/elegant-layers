import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createCakeOrder } from "@/app/(dashboard)/cake-orders/actions";
import { CakeOrderForm } from "@/components/cake-orders/cake-order-form";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default async function NewCakeOrderPage() {
    await requireRole(["ADMIN", "CASHIER"]);

    const products = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">New Cake Order</CardTitle>
                    <CardDescription>
                        Take a custom cake order from a customer.
                    </CardDescription>
                </CardHeader>
            </Card>

            <CakeOrderForm action={createCakeOrder} products={products} submitLabel="Create Order" />
        </div>
    );
}