import Link from "next/link";
import { ReceiptText, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
    colomboDayEnd,
    colomboDayStart,
    colomboToday,
} from "@/lib/format";
import { getIncome } from "@/lib/income";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const money = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function yesterdayOf(day: string) {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

export async function TodaysSalesCard() {
    const today = colomboToday();
    const yesterday = yesterdayOf(today);
    const start = colomboDayStart(today);
    const end = colomboDayEnd(today);

    const [incomeToday, incomeYesterday, billCount, voidedCount] =
        await Promise.all([
            getIncome({ from: today, to: today }, 1),
            getIncome({ from: yesterday, to: yesterday }, 1),
            prisma.sale.count({
                where: {
                    status: "COMPLETED",
                    updatedAt: { gte: start, lte: end },
                },
            }),
            prisma.sale.count({
                where: {
                    status: "VOID",
                    voidedAt: { gte: start, lte: end },
                },
            }),
        ]);

    const t = incomeToday.totals;

    return (
        <Card className="@container/card">
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                        <CardDescription>Income today</CardDescription>

                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            Rs. {money.format(t.total)}
                        </CardTitle>

                        <p className="text-xs text-muted-foreground">
                            Yesterday (full day): Rs.{" "}
                            {money.format(incomeYesterday.totals.total)}
                        </p>
                    </div>

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ReceiptText className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/30 text-sm">
                    <div className="flex items-center justify-between p-3">
                        <span className="flex items-center gap-2">
                            <ReceiptText className="size-4 text-muted-foreground" />
                            POS bills
                            <span className="text-xs text-muted-foreground">
                                ({billCount} bill{billCount === 1 ? "" : "s"})
                            </span>
                        </span>
                        <span className="font-medium tabular-nums">
                            Rs. {money.format(t.pos)}
                        </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-3">
                        <span className="flex items-center gap-2">
                            <Wallet className="size-4 text-muted-foreground" />
                            Cake order advances
                        </span>
                        <span className="font-medium tabular-nums">
                            Rs. {money.format(t.cakeAdvance)}
                        </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-3">
                        <span className="flex items-center gap-2">
                            <Wallet className="size-4 text-muted-foreground" />
                            Cake order balances
                        </span>
                        <span className="font-medium tabular-nums">
                            Rs. {money.format(t.cakeBalance)}
                        </span>
                    </div>
                </div>

                {voidedCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {voidedCount} voided sale
                        {voidedCount === 1 ? "" : "s"} today
                    </p>
                )}

                <Link
                    href={`/income?from=${today}&to=${today}`}
                    className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                    See today&apos;s income in detail
                </Link>
            </CardContent>
        </Card>
    );
}