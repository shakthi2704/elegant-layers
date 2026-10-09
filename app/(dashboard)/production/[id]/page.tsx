import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
        include: { ingredient: true, product: true },
    });

    const ingredientsConsumed = consumed.filter(
        (txn) => txn.itemType === "INGREDIENT"
    );

    const componentsConsumed = consumed.filter(
        (txn) => txn.itemType === "PRODUCT"
    );

    return (
        <div className="space-y-6 px-6">
            {/* Production Details */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">
                        Production Details
                    </CardTitle>

                    <CardDescription>
                        Recorded by {production.producedBy.name} on{" "}
                        {formatDate(production.createdAt)}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground">
                                Production Date
                            </p>

                            <p className="font-medium">
                                {formatDate(production.productionDate)}
                            </p>
                        </div>

                        {production.notes && (
                            <div className="space-y-1.5">
                                <p className="text-sm text-muted-foreground">
                                    Notes
                                </p>

                                <p className="font-medium">
                                    {production.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Produced */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-base">
                        Produced
                    </CardTitle>

                    <CardDescription>
                        Products created during this production run.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-hidden">
                        <Table className="w-full text-sm">
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Product
                                    </TableHead>

                                    <TableHead className="px-4 py-2.5 text-right font-medium">
                                        Quantity
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-border bg-muted/20">
                                {production.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="px-4 py-2.5 font-medium">
                                            {item.product.name}
                                        </TableCell>

                                        <TableCell className="px-4 py-2.5 text-right">
                                            {item.quantityProduced.toString()}{" "}
                                            {item.product.unit}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Ingredients Consumed */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-base">
                        Ingredients Consumed
                    </CardTitle>

                    <CardDescription>
                        Ingredients used during this production run.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-hidden">
                        <Table className="w-full text-sm">
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Ingredient
                                    </TableHead>

                                    <TableHead className="px-4 py-2.5 text-right font-medium">
                                        Quantity
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-border bg-muted/20">
                                {ingredientsConsumed.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell className="px-4 py-2.5 font-medium">
                                            {txn.ingredient?.name}
                                        </TableCell>

                                        <TableCell className="px-4 py-2.5 text-right">
                                            {txn.quantity.abs().toString()}{" "}
                                            {txn.ingredient?.unit}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Base Components Consumed */}
            {componentsConsumed.length > 0 && (
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Base Components Consumed
                        </CardTitle>

                        <CardDescription>
                            Base products consumed during this production run.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-hidden">
                            <Table className="w-full text-sm">
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead className="px-4 py-2.5 font-medium">
                                            Base Product
                                        </TableHead>

                                        <TableHead className="px-4 py-2.5 text-right font-medium">
                                            Quantity
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="divide-y divide-border bg-muted/20">
                                    {componentsConsumed.map((txn) => (
                                        <TableRow key={txn.id}>
                                            <TableCell className="px-4 py-2.5 font-medium">
                                                {txn.product?.name}
                                            </TableCell>

                                            <TableCell className="px-4 py-2.5 text-right">
                                                {txn.quantity.abs().toString()}{" "}
                                                {txn.product?.unit}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
