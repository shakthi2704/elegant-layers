
import { prisma } from "@/lib/prisma";
import {
    colomboDayEnd,
    colomboDayStart,
    colomboToday,
} from "@/lib/format";
import { ReceiptText, TrendingUp } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export async function TodaysSalesCard() {
    const today = colomboToday();
    const start = colomboDayStart(today);
    const end = colomboDayEnd(today);

    const [sales, voidedCount] = await Promise.all([
        prisma.sale.aggregate({
            where: {
                status: "COMPLETED",
                updatedAt: {
                    gte: start,
                    lte: end,
                },
            },
            _sum: {
                total: true,
            },
            _count: true,
        }),

        prisma.sale.count({
            where: {
                status: "VOID",
                voidedAt: {
                    gte: start,
                    lte: end,
                },
            },
        }),
    ]);

    const total = sales._sum.total?.toNumber() ?? 0;
    const billCount = sales._count;

    const formattedTotal = total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <Card className="@container/card">
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                        <CardDescription>POS sales today</CardDescription>

                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            Rs. {formattedTotal}
                        </CardTitle>
                    </div>

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ReceiptText className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="size-4" />
                        <span>
                            {billCount} bill{billCount === 1 ? "" : "s"}
                        </span>
                    </div>

                    <span className="text-muted-foreground">
                        completed today
                    </span>
                </div>

                {voidedCount > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {voidedCount} voided sale
                        {voidedCount === 1 ? "" : "s"} today
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
