import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    StatusFilterSelect,
    CashierFilterSelect,
} from "@/components/pos/sales-history-filters";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const RESULT_CAP = 100;

// Sri Lanka has a fixed UTC+5:30 offset (no DST), so a calendar day picked in
// the date inputs can be converted to a precise UTC instant without needing
// a timezone library — this must stay in sync with the Asia/Colombo constant
// in lib/format.ts.
function colomboDayStart(dateStr: string) {
    return new Date(`${dateStr}T00:00:00+05:30`);
}

function colomboDayEnd(dateStr: string) {
    return new Date(`${dateStr}T23:59:59.999+05:30`);
}

export default async function SalesHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{
        status?: string;
        cashierId?: string;
        from?: string;
        to?: string;
    }>;
}) {
    await requireRole(["ADMIN", "CASHIER"]);
    const { status, cashierId, from, to } = await searchParams;

    const where: Prisma.SaleWhereInput = {
        status:
            status === "COMPLETED" || status === "VOID"
                ? status
                : { in: ["COMPLETED", "VOID"] },
        cashierId: cashierId && cashierId !== "ALL" ? cashierId : undefined,
        createdAt: {
            gte: from ? colomboDayStart(from) : undefined,
            lte: to ? colomboDayEnd(to) : undefined,
        },
    };

    const [sales, cashiers] = await Promise.all([
        prisma.sale.findMany({
            where,
            include: { cashier: true },
            orderBy: { createdAt: "desc" },
            take: RESULT_CAP,
        }),
        prisma.user.findMany({
            where: { sales: { some: {} } },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Sales History</h1>
                <p className="text-sm text-muted-foreground">
                    Completed and voided bills.
                </p>
            </div>

            <form
                method="get"
                className="flex flex-wrap items-end gap-4 rounded-lg border border-border p-4"
            >
                <StatusFilterSelect defaultValue={status ?? "ALL"} />

                <CashierFilterSelect
                    defaultValue={cashierId ?? "ALL"}
                    cashiers={cashiers.map((c) => ({ id: c.id, name: c.name }))}
                />

                <div className="space-y-1.5">
                    <Label htmlFor="from">From</Label>
                    <Input id="from" type="date" name="from" defaultValue={from} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="to">To</Label>
                    <Input id="to" type="date" name="to" defaultValue={to} />
                </div>

                <div className="flex gap-2">
                    <Button type="submit" size="sm">
                        Filter
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/pos/history" />}
                    >
                        Clear
                    </Button>
                </div>
            </form>

            <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sale #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Cashier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium">
                                    {sale.saleNumber}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDateTime(sale.createdAt)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {sale.type === "DINE_IN" ? "Dine-in" : "Takeaway"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {sale.cashier.name}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            sale.status === "VOID" ? "destructive" : "secondary"
                                        }
                                    >
                                        {sale.status === "VOID" ? "Void" : "Completed"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {sale.total.toString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        nativeButton={false}
                                        render={<Link href={`/pos/${sale.id}`} />}
                                    >
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sales.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No sales match these filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {sales.length === RESULT_CAP && (
                <p className="text-sm text-muted-foreground">
                    Showing the latest {RESULT_CAP} results — narrow your filters to see
                    more.
                </p>
            )}
        </div>
    );
}