
import { BarChart3 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { colomboDayStart, colomboToday } from "@/lib/format";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const weekdayFormat = new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    weekday: "short",
});

const compactFormat = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});

const fullFormat = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export async function SalesTrendCard() {
    const todayKey = colomboToday();
    const todayStart = colomboDayStart(todayKey);

    // Colombo has no DST, so stepping back in whole days is safe.
    const days = Array.from({ length: DAYS }, (_, i) => {
        const start = new Date(
            todayStart.getTime() - (DAYS - 1 - i) * DAY_MS
        );

        return {
            key: colomboToday(start),
            label: weekdayFormat.format(start),
            start,
        };
    });

    const sales = await prisma.sale.findMany({
        where: {
            status: "COMPLETED",
            updatedAt: { gte: days[0].start },
        },
        select: {
            total: true,
            updatedAt: true,
        },
    });

    const totals = new Map<string, number>();

    for (const sale of sales) {
        const key = colomboToday(sale.updatedAt);

        totals.set(
            key,
            (totals.get(key) ?? 0) + sale.total.toNumber()
        );
    }

    const data = days.map((d) => ({
        ...d,
        total: totals.get(d.key) ?? 0,
        isToday: d.key === todayKey,
    }));

    const max = Math.max(...data.map((d) => d.total), 0);
    const weekTotal = data.reduce(
        (sum, d) => sum + d.total,
        0
    );

    return (
        <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardDescription className="flex items-center gap-2">
                            <BarChart3 className="size-4" />
                            POS sales · last {DAYS} days
                        </CardDescription>

                        <CardTitle className="text-3xl font-semibold tracking-tight">
                            Rs. {fullFormat.format(weekTotal)}
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Completed sales over the last {DAYS} days
                        </p>
                    </div>

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BarChart3 className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col">
                <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex h-32 items-end gap-2 sm:h-36">
                        {data.map((d) => {
                            const percent =
                                max > 0
                                    ? (d.total / max) * 100
                                    : 0;

                            return (
                                <div
                                    key={d.key}
                                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                                    title={`${d.label}: Rs. ${fullFormat.format(
                                        d.total
                                    )}`}
                                >
                                    <div className="flex h-full w-full items-end justify-center">
                                        <div
                                            className={`w-full max-w-10 rounded-t-md transition-colors ${d.isToday
                                                    ? "bg-primary"
                                                    : "bg-primary/25 hover:bg-primary/40"
                                                }`}
                                            style={{
                                                height: `${percent}%`,
                                                minHeight: "2px",
                                            }}
                                        />
                                    </div>

                                    <span
                                        className={`text-xs tabular-nums ${d.isToday
                                                ? "font-medium text-foreground"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        {compactFormat.format(d.total)}
                                    </span>

                                    <span
                                        className={`text-xs ${d.isToday
                                                ? "font-semibold text-foreground"
                                                : "font-medium text-muted-foreground"
                                            }`}
                                    >
                                        {d.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Daily sales</span>

                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        <span>Today</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


