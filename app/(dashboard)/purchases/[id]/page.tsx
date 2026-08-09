import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default async function PurchaseDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
            supplier: true,
            createdBy: true,
            items: { include: { ingredient: true } },
        },
    });

    if (!purchase) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Purchase Details</h1>
                <p className="text-sm text-muted-foreground">
                    Recorded by {purchase.createdBy.name} on{" "}
                    {purchase.createdAt.toLocaleDateString()}
                </p>
            </div>

            <div className="grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-border p-4">
                <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{purchase.supplier.name}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{purchase.purchaseDate.toLocaleDateString()}</p>
                </div>
            </div>

            <div className="max-w-2xl overflow-hidden rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ingredient</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchase.items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.ingredient.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {item.quantity.toString()} {item.ingredient.unit}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    Rs. {item.unitCost.toString()}
                                </TableCell>
                                <TableCell className="text-right">Rs. {item.subtotal.toString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="max-w-2xl flex justify-end border-t border-border pt-4">
                <p className="text-base font-semibold">
                    Total: Rs. {purchase.totalAmount.toString()}
                </p>
            </div>
        </div>
    );
}