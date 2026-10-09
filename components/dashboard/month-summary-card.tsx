import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Receipt, TrendingUp } from "lucide-react";

import { getProfitSummary, resolvePeriod } from "@/lib/reports";
import { cn } from "@/lib/utils";
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

const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Colombo",
});

function rs(n: number) {
    return n < 0 ? `-Rs. ${money.format(Math.abs(n))}` : `Rs. ${money.format(n)}`;
}

export async function MonthSummaryCard() {
    // No arguments = the current Colombo month, up to today.
    const s = await getProfitSummary(resolvePeriod());
    const profit = s.profitBeforeDepreciation;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="size-4" />
                            {monthLabel.format(new Date())} · profit so far
                        </CardDescription>

                        <CardTitle
                            className={cn(
                                "text-3xl font-semibold tracking-tight",
                                profit < 0
                                    ? "text-destructive"
                                    : "text-emerald-600 dark:text-emerald-400"
                            )}
                        >
                            {rs(profit)}
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Before depreciation
                        </p>
                    </div>

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <TrendingUp className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <ArrowDownLeft className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Income</p>
                                <p className="text-xs text-muted-foreground">
                                    POS bills and cake orders
                                </p>
                            </div>
                        </div>
                        <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {rs(s.income.total)}
                        </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                                <ArrowUpRight className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Purchases</p>
                                <p className="text-xs text-muted-foreground">
                                    Stock bought
                                </p>
                            </div>
                        </div>
                        <span className="font-semibold tabular-nums">
                            {rs(s.purchases.total)}
                        </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                                <Receipt className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Expenses</p>
                                <p className="text-xs text-muted-foreground">
                                    Rent, bills, salaries and more
                                </p>
                            </div>
                        </div>
                        <span className="font-semibold tabular-nums">
                            {rs(s.expenses.total)}
                        </span>
                    </div>
                </div>

                <Link
                    href="/reports"
                    className="mt-auto flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                    See the full report
                </Link>
            </CardContent>
        </Card>
    );
}