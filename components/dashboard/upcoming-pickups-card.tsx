
import Link from "next/link";
import {
    ArrowRight,
    CakeSlice,
    Clock3,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate, isPickupOverdue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const LIMIT = 5;

const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    READY: "Ready",
};

export async function UpcomingPickupsCard() {
    const now = new Date();

    const orders = await prisma.cakeOrder.findMany({
        where: {
            status: {
                in: ["PENDING", "IN_PROGRESS", "READY"],
            },
        },
        include: {
            customer: true,
        },
        orderBy: [
            { pickupDate: "asc" },
            { pickupTime: "asc" },
        ],
        take: LIMIT,
    });

    return (
        <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardDescription className="flex items-center gap-2">
                            <CakeSlice className="size-4" />
                            Cake orders · pickups
                        </CardDescription>

                        <CardTitle className="text-3xl font-semibold tracking-tight">
                            {orders.length}
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Next {LIMIT} scheduled pickups
                        </p>
                    </div>

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CakeSlice className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col">
                {orders.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="flex w-full items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CakeSlice className="size-4" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    No active cake orders
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    There are no upcoming pickups.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg border bg-background">
                            <div className="flex items-center justify-between px-3.5 py-2.5">
                                <p className="text-sm font-medium">
                                    Upcoming pickups
                                </p>

                                <Badge
                                    variant="secondary"
                                    className="tabular-nums"
                                >
                                    {orders.length}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="divide-y">
                                {orders.map((order) => {
                                    const overdue = isPickupOverdue(
                                        order.pickupDate,
                                        order.pickupTime,
                                        now
                                    );

                                    return (
                                        <Link
                                            key={order.id}
                                            href={`/cake-orders/${order.id}`}
                                            className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div
                                                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${overdue
                                                    ? "bg-destructive/10 text-destructive"
                                                    : "bg-primary/10 text-primary"
                                                    }`}
                                            >
                                                <Clock3 className="size-4" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {order.cakeName}
                                                </p>

                                                <p className="truncate text-xs text-muted-foreground">
                                                    {order.customer.name}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <div
                                                    className={`flex items-center gap-1.5 whitespace-nowrap text-xs ${overdue ? "text-destructive" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    <span className="font-medium">
                                                        {formatDate(order.pickupDate)}
                                                    </span>

                                                    <span className="text-muted-foreground/50">·</span>

                                                    <span>{order.pickupTime}</span>
                                                </div>

                                                <Badge
                                                    variant={
                                                        overdue
                                                            ? "destructive"
                                                            : "secondary"
                                                    }
                                                    className="hidden shrink-0 sm:inline-flex"
                                                >
                                                    {overdue
                                                        ? "Overdue"
                                                        : STATUS_LABEL[
                                                        order.status
                                                        ] ??
                                                        order.status}
                                                </Badge>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <Link
                            href="/cake-orders"
                            className="mt-auto flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
                        >
                            <span>View all orders</span>
                            <ArrowRight className="size-4" />
                        </Link>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
