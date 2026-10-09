
import Link from "next/link";
import {
    ArrowRight,
    CakeSlice,
    CheckCircle2,
    Clock3,
    AlertCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { colomboToday, isPickupOverdue } from "@/lib/format";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export async function CakeOrdersCard() {
    const today = colomboToday();
    const now = new Date();

    const orders = await prisma.cakeOrder.findMany({
        where: {
            status: {
                in: ["PENDING", "IN_PROGRESS", "READY"],
            },
        },
        select: {
            status: true,
            pickupDate: true,
            pickupTime: true,
        },
    });

    let overdue = 0;
    let dueToday = 0;
    let ready = 0;

    for (const order of orders) {
        if (isPickupOverdue(order.pickupDate, order.pickupTime, now)) {
            overdue++;
        } else if (
            order.pickupDate.toISOString().slice(0, 10) === today
        ) {
            dueToday++;
        }

        if (order.status === "READY") {
            ready++;
        }
    }

    return (
        <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardDescription className="flex items-center gap-2">
                            <CakeSlice className="size-4" />
                            Cake orders
                        </CardDescription>

                        <CardTitle className="text-3xl font-semibold tracking-tight">
                            {orders.length}
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Active order{orders.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CakeSlice className="size-5" />
                    </div>
                </div>
            </CardHeader>


            <CardContent className="flex-1 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                    <Badge
                        variant={overdue > 0 ? "destructive" : "default"}
                        className="h-10 w-full justify-center gap-1.5 px-4"
                    >
                        <AlertCircle className="size-4 shrink-0" />
                        <span>Overdue: {overdue}</span>
                    </Badge>

                    <Badge
                        variant="secondary"
                        className="h-10 w-full justify-center gap-1.5 px-4"
                    >
                        <Clock3 className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Today: {dueToday}</span>
                    </Badge>

                    <Badge
                        variant="secondary"
                        className="h-10 w-full justify-center gap-1.5 px-4"
                    >
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Ready: {ready}</span>
                    </Badge>
                </div>
            </CardContent>


            <Separator />

            <CardFooter className="mt-auto p-3 pt-0">
                <Button variant="ghost" className="w-full">
                    <Link
                        href="/cake-orders"
                        className="mt-auto flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <span>View all cake orders</span>
                        <ArrowRight className="size-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
