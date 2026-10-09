
import Link from "next/link";
import {
    AlertCircle,
    ArrowRight,
    PackageCheck,
    PackageX,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";

const LIST_LIMIT = 5;

type Status = "OUT" | "LOW" | "OK";

// Same rule as the Stock tab on /inventory — keep the two in sync.
function getStatus(current: number, minimum: number): Status {
    if (current <= 0) return "OUT";
    if (current <= minimum) return "LOW";
    return "OK";
}

export async function StockAlertsCard() {
    const select = {
        name: true,
        unit: true,
        currentStock: true,
        minimumStock: true,
    } as const;

    const [ingredients, products] = await Promise.all([
        prisma.ingredient.findMany({ select }),
        prisma.product.findMany({
            where: { isFinishedProduct: true },
            select,
        }),
    ]);

    const alerts = [...ingredients, ...products]
        .map((item) => {
            const current = item.currentStock.toNumber();

            return {
                name: item.name,
                unit: item.unit,
                current,
                status: getStatus(
                    current,
                    item.minimumStock.toNumber()
                ),
            };
        })
        .filter((a) => a.status !== "OK")
        .sort((a, b) =>
            a.status === b.status
                ? a.name.localeCompare(b.name)
                : a.status === "OUT"
                    ? -1
                    : 1
        );

    const outCount = alerts.filter(
        (a) => a.status === "OUT"
    ).length;

    const lowCount = alerts.length - outCount;
    const shown = alerts.slice(0, LIST_LIMIT);

    return (
        <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardDescription className="flex items-center gap-2">
                            <PackageCheck className="size-4" />
                            Inventory · stock alerts
                        </CardDescription>

                        <CardTitle className="text-3xl font-semibold tracking-tight">
                            {alerts.length}
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            {alerts.length === 0
                                ? "Everything is sufficiently stocked"
                                : `${alerts.length} item${alerts.length === 1 ? "" : "s"} need attention`}
                        </p>
                    </div>

                    <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${alerts.length > 0
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                    >
                        {alerts.length > 0 ? (
                            <AlertCircle className="size-5" />
                        ) : (
                            <PackageCheck className="size-5" />
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3.5">
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                                <PackageX className="size-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Out of stock
                                </p>
                                <p
                                    className={`text-lg font-semibold tabular-nums ${outCount > 0
                                        ? "text-destructive"
                                        : ""
                                        }`}
                                >
                                    {outCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3.5">
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="size-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                    Low stock
                                </p>
                                <p className="text-lg font-semibold tabular-nums">
                                    {lowCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {shown.length > 0 && (
                    <div className="rounded-lg border bg-background">
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                            <p className="text-sm font-medium">
                                Items requiring attention
                            </p>

                            <Badge
                                variant="secondary"
                                className="tabular-nums"
                            >
                                {alerts.length}
                            </Badge>
                        </div>

                        <Separator />

                        <ul className="divide-y">
                            {shown.map((a) => (
                                <li
                                    key={`${a.name}-${a.unit}`}
                                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span
                                            className={`size-2 shrink-0 rounded-full ${a.status === "OUT"
                                                ? "bg-destructive"
                                                : "bg-amber-500"
                                                }`}
                                        />

                                        <span className="truncate text-sm font-medium">
                                            {a.name}
                                        </span>
                                    </div>

                                    <Badge
                                        variant={
                                            a.status === "OUT"
                                                ? "destructive"
                                                : "secondary"
                                        }
                                        className="shrink-0 tabular-nums"
                                    >
                                        {a.current} {a.unit}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {alerts.length === 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <PackageCheck className="size-4" />
                        </div>

                        <div>
                            <p className="text-sm font-medium">
                                All stocked up
                            </p>
                            <p className="text-xs text-muted-foreground">
                                No ingredients or products need attention.
                            </p>
                        </div>
                    </div>
                )}


            </CardContent>
            <CardFooter className="mt-auto p-3 pt-0">
                <Button variant="ghost" className="w-full">
                    <Link
                        href="/inventory?view=stock&low=1"
                        className="mt-auto flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <span>
                            {alerts.length > LIST_LIMIT
                                ? `View all ${alerts.length} alerts`
                                : "View stock"}
                        </span>
                        <ArrowRight className="size-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
