
import {
    AlertCircle,
    ArrowDownLeft,
    Wallet,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const money = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export async function CakeBalanceCard() {
    const orders = await prisma.cakeOrder.findMany({
        where: {
            status: {
                in: ["PENDING", "IN_PROGRESS", "READY"],
            },
        },
        select: {
            price: true,
            advancePaid: true,
        },
    });

    let orderValue = 0;
    let balance = 0;
    let advances = 0;
    let noPrice = 0;

    for (const order of orders) {
        const advance = order.advancePaid?.toNumber() ?? 0;
        advances += advance;

        if (order.price === null) {
            noPrice++;
            continue;
        }

        const price = order.price.toNumber();

        orderValue += price;
        balance += price - advance;
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardDescription className="flex items-center gap-2">
                            <Wallet className="size-4" />
                            Cake orders · balance to collect
                        </CardDescription>

                        <CardTitle className="text-3xl font-semibold tracking-tight">
                            Rs. {money.format(balance)}
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Outstanding balance from active orders
                        </p>
                    </div>

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Wallet className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                                <Wallet className="size-4" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    Order value
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total active orders
                                </p>
                            </div>
                        </div>

                        <span className="font-semibold tabular-nums">
                            Rs. {money.format(orderValue)}
                        </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <ArrowDownLeft className="size-4" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    Advances received
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Payments already collected
                                </p>
                            </div>
                        </div>

                        <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            Rs. {money.format(advances)}
                        </span>
                    </div>
                </div>

                {noPrice > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                            <AlertCircle className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                                Price not set
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {noPrice} active{" "}
                                {noPrice === 1 ? "order has" : "orders have"}{" "}
                                no price
                            </p>
                        </div>

                        <Badge
                            variant="destructive"
                            className="shrink-0 tabular-nums"
                        >
                            {noPrice}
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
