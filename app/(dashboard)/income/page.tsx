import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { formatDateTime } from "@/lib/format";
import { getIncome, type IncomeSource } from "@/lib/income";
import { IncomeFilterBar } from "@/components/income/income-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const ROW_LIMIT = 100;

const money = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const SOURCE_LABELS: Record<IncomeSource, string> = {
    POS: "POS bill",
    CAKE_ADVANCE: "Cake advance",
    CAKE_BALANCE: "Cake balance",
};

function TotalCard({
    title,
    value,
    strong = false,
}: {
    title: string;
    value: number;
    strong?: boolean;
}) {
    return (
        <Card className="p-4">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={strong ? "text-2xl font-semibold" : "text-xl font-medium"}>
                Rs. {money.format(value)}
            </p>
        </Card>
    );
}

export default async function IncomePage({
    searchParams,
}: {
    searchParams: Promise<{ source?: string; from?: string; to?: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { source, from, to } = await searchParams;

    const income = await getIncome({ source, from, to }, ROW_LIMIT);

    const showHeldNote =
        income.heldOnCancelled.count > 0 &&
        (!source || source === "ALL" || source === "CAKE_ADVANCE");

    return (
        <div className="space-y-6 px-6">
            <Card className="p-4">
                <div>
                    <h1 className="text-3xl font-semibold">Income</h1>
                    <p className="text-sm text-muted-foreground">
                        Money received from POS bills and cake orders. This page is
                        read-only: every row comes from a bill or an order.
                    </p>
                </div>
            </Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TotalCard title="Total income" value={income.totals.total} strong />
                <TotalCard title="POS bills" value={income.totals.pos} />
                <TotalCard title="Cake order advances" value={income.totals.cakeAdvance} />
                <TotalCard title="Cake order balances" value={income.totals.cakeBalance} />
            </div>

            {showHeldNote && (
                <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Not counted: Rs. {money.format(income.heldOnCancelled.amount)}{" "}
                    in advances held on {income.heldOnCancelled.count} cancelled
                    order{income.heldOnCancelled.count === 1 ? "" : "s"}. These
                    stay out of income until it is decided whether they are
                    kept or refunded.
                </div>
            )}
            <IncomeFilterBar defaults={{ source, from, to }} />
            {income.noPriceCount > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                    {income.noPriceCount} collected order
                    {income.noPriceCount === 1 ? " has" : "s have"} no price
                    set, so no balance could be counted for{" "}
                    {income.noPriceCount === 1 ? "it" : "them"}. Rows are
                    flagged below.
                </div>
            )}

            <div className="overflow-hidden rounded-md">
                <Table className="w-full border border-border text-sm">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Date
                            </TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Source
                            </TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Reference
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Amount
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border bg-muted/20">
                        {income.rows.map((row) => (
                            <TableRow key={row.key}>
                                <TableCell>{formatDateTime(row.date)}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {SOURCE_LABELS[row.source]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {row.label}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(row.amount)}
                                    {row.flag && (
                                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                                            {row.flag}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        nativeButton={false}
                                        render={<Link href={row.href} />}
                                    >
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {income.rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No income found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {income.matchCount > ROW_LIMIT && (
                <p className="text-sm text-muted-foreground">
                    Showing the latest {ROW_LIMIT} of {income.matchCount} rows.
                    The totals above cover all of them. Use the filters to
                    narrow the list.
                </p>
            )}
        </div>
    );
}