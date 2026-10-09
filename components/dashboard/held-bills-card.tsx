
import Link from "next/link";
import {
    AlertCircle,
    ArrowRight,
    PauseCircle,
    ReceiptText,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { colomboDayStart, colomboToday } from "@/lib/format";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const LIST_LIMIT = 3;

export async function HeldBillsCard() {
    const todayStart = colomboDayStart(colomboToday());

    const [heldCount, earlierCount, recent] = await Promise.all([
        prisma.sale.count({
            where: { status: "HELD" },
        }),
        prisma.sale.count({
            where: {
                status: "HELD",
                createdAt: { lt: todayStart },
            },
        }),
        prisma.sale.findMany({
            where: { status: "HELD" },
            orderBy: { createdAt: "desc" },
            take: LIST_LIMIT,
            select: {
                id: true,
                saleNumber: true,
                holdLabel: true,
            },
        }),
    ]);

    return (
        <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardDescription className="flex items-center gap-2">
                            <PauseCircle className="size-4" />
                            POS · held bills
                        </CardDescription>

                        <CardTitle className="text-3xl font-semibold tracking-tight">
                            {heldCount}
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            {heldCount === 0
                                ? "No bills currently on hold"
                                : `${heldCount} bill${heldCount === 1 ? "" : "s"} waiting to be resumed`}
                        </p>
                    </div>

                    <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${heldCount > 0
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                            }`}
                    >
                        <PauseCircle className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col space-y-3">
                {/* Older held bills */}
                {earlierCount > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                            <AlertCircle className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                                Older held bills
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Held since an earlier day
                            </p>
                        </div>

                        <Badge
                            variant="destructive"
                            className="shrink-0 tabular-nums"
                        >
                            {earlierCount}
                        </Badge>
                    </div>
                )}

                {/* Recent bills */}
                {recent.length > 0 && (
                    <div className="rounded-lg border bg-background">
                        <div className="flex items-center justify-between px-3.5 py-2.5">
                            <p className="text-sm font-medium">
                                Recent holds
                            </p>

                            <Badge
                                variant="secondary"
                                className="tabular-nums"
                            >
                                {recent.length}
                            </Badge>
                        </div>

                        <Separator />

                        <ul className="divide-y">
                            {recent.map((bill) => (
                                <li
                                    key={bill.id}
                                    className="flex items-center gap-3 px-3.5 py-2.5"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                        <ReceiptText className="size-4" />
                                    </div>

                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {bill.holdLabel ?? bill.saleNumber}
                                    </span>

                                    <Badge
                                        variant="outline"
                                        className="shrink-0"
                                    >
                                        Held
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Empty state */}
                {heldCount === 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <ReceiptText className="size-4" />
                        </div>

                        <div>
                            <p className="text-sm font-medium">
                                All clear
                            </p>
                            <p className="text-xs text-muted-foreground">
                                There are no bills waiting on hold.
                            </p>
                        </div>
                    </div>
                )}

                {/* Always stays at the bottom */}
                <Link
                    href="/pos"
                    className="mt-auto flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                    <span>Open POS</span>
                    <ArrowRight className="size-4" />
                </Link>
            </CardContent>
        </Card>
    );
}


