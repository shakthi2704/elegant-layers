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

export default async function ProductionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const production = await prisma.production.findUnique({
        where: { id },
        include: {
            producedBy: true,
            items: { include: { product: true } },
        },
    });

    if (!production) {
        notFound();
    }

    const consumed = await prisma.inventoryTransaction.findMany({
        where: {
            referenceType: "PRODUCTION",
            referenceId: production.id,
            type: "PRODUCTION_OUT",
        },
        include: { ingredient: true },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Production Details</h1>
                <p className="text-sm text-muted-foreground">
                    Recorded by {production.producedBy.name} on{" "}
                    {production.createdAt.toLocaleDateString()}
                </p>
            </div>

            <div className="grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-border p-4">
                <div>
                    <p className="text-sm text-muted-foreground">Production Date</p>
                    <p className="font-medium">{production.productionDate.toLocaleDateString()}</p>
                </div>
                {production.notes && (
                    <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="font-medium">{production.notes}</p>
                    </div>
                )}
            </div>

            <div className="max-w-2xl space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">Produced</h2>
                <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {production.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.product.name}</TableCell>
                                    <TableCell className="text-right">
                                        {item.quantityProduced.toString()} {item.product.unit}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="max-w-2xl space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                    Ingredients Consumed
                </h2>
                <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ingredient</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consumed.map((txn) => (
                                <TableRow key={txn.id}>
                                    <TableCell className="font-medium">{txn.ingredient?.name}</TableCell>
                                    <TableCell className="text-right">
                                        {txn.quantity.abs().toString()} {txn.ingredient?.unit}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}