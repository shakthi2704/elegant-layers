import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createCakeOrder } from "@/app/(dashboard)/cake-orders/actions";
import { CakeOrderForm } from "@/components/cake-orders/cake-order-form";

export default async function NewCakeOrderPage() {
    await requireRole(["ADMIN", "CASHIER"]);

    const products = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">New Cake Order</h1>
                <p className="text-sm text-muted-foreground">
                    Take a custom cake order from a customer.
                </p>
            </div>

            <CakeOrderForm action={createCakeOrder} products={products} submitLabel="Create Order" />
        </div>
    );
}