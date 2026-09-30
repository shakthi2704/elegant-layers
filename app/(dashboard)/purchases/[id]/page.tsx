import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

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
            items: { include: { ingredient: true, product: true } },
        },
    });

    if (!purchase) {
        notFound();
    }

    return (
        <div className="space-y-6 px-6">
            {/* Header */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-xl">
                        Purchase Details
                    </CardTitle>

                    <CardDescription>
                        Recorded by {purchase.createdBy.name} on{" "}
                        {formatDate(purchase.createdAt)}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Purchase Date */}
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Purchased Date
                            </p>

                            <p className="font-medium">
                                {formatDate(purchase.purchaseDate)}
                            </p>
                        </div>

                        {/* Supplier */}
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Supplier
                            </p>

                            <p className="font-medium">
                                {purchase.supplier.name}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-base">
                        Purchased Items
                    </CardTitle>

                    <CardDescription>
                        Items included in this purchase.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="overflow-hidden rounded-md">
                        <Table className="w-full border border-border text-sm">
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Item
                                    </TableHead>

                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Quantity
                                    </TableHead>

                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Unit Cost
                                    </TableHead>

                                    <TableHead className="px-4 py-2.5 text-right font-medium">
                                        Subtotal
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-border bg-muted/20">
                                {purchase.items.map((item) => {
                                    const name =
                                        item.itemType === "PRODUCT"
                                            ? item.product?.name
                                            : item.ingredient?.name;

                                    const unit =
                                        item.itemType === "PRODUCT"
                                            ? item.product?.unit
                                            : item.ingredient?.unit;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="px-4 py-2.5 font-medium">
                                                {name}
                                            </TableCell>

                                            <TableCell className="px-4 py-2.5 text-muted-foreground">
                                                {item.quantity.toString()} {unit}
                                            </TableCell>

                                            <TableCell className="px-4 py-2.5 text-muted-foreground">
                                                Rs. {item.unitCost.toString()}
                                            </TableCell>

                                            <TableCell className="px-4 py-2.5 text-right">
                                                Rs. {item.subtotal.toString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Total */}
                    <div className="mt-4 flex justify-end border-t border-border pt-4">
                        <p className="text-base font-semibold">
                            Total: Rs. {purchase.totalAmount.toString()}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

    );
}