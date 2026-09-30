import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";


import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
export default async function AdjustmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const adjustment = await prisma.inventoryTransaction.findUnique({
        where: { id },
        include: { ingredient: true, product: true, createdBy: true },
    });

    if (!adjustment || adjustment.type !== "ADJUSTMENT") {
        notFound();
    }

    const item = adjustment.ingredient ?? adjustment.product;
    const quantity = adjustment.quantity.toNumber();
    const previousBalance = adjustment.balanceAfter.toNumber() - quantity;

    return (
        <div className="space-y-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-xl">Stock Details</CardTitle>
                    <CardDescription>
                        Recorded by {adjustment.createdBy.name} on{" "}
                        {formatDate(adjustment.createdAt)}
                    </CardDescription>
                </CardHeader>
            </Card>
            <Card className="max-w-2xl">
                <CardContent>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground">
                                Item
                            </p>
                            <p className="font-medium">{item?.name}</p>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground">
                                Type
                            </p>
                            <p className="font-medium">
                                {adjustment.itemType === "INGREDIENT"
                                    ? "Ingredient"
                                    : "Product"}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground">
                                Previous Stock
                            </p>
                            <p className="font-medium">
                                {previousBalance} {item?.unit}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground">
                                Change
                            </p>
                            <p
                                className={`font-medium ${quantity >= 0
                                    ? "text-emerald-500"
                                    : "text-destructive"
                                    }`}
                            >
                                {quantity >= 0 ? "+" : ""}
                                {adjustment.quantity.toString()}{" "}
                                {item?.unit}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground">
                                New Stock
                            </p>
                            <p className="font-medium">
                                {adjustment.balanceAfter.toString()}{" "}
                                {item?.unit}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-base">Reason</CardTitle>
                    <CardDescription>
                        The reason provided for this adjustment.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                        {adjustment.note}
                    </p>
                </CardContent>
            </Card>
        </div>

    );
}