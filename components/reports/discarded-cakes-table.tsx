import Link from "next/link";

import { formatDate } from "@/lib/format";
import { getDiscardedCakes, type ReportPeriod } from "@/lib/reports";
import { WASTE_REASON_OPTIONS } from "@/lib/validations/inventory-waste";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const money = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const OUTCOME_LABEL: Record<string, string> = {
    KEPT: "Advance kept",
    REFUNDED: "Advance refunded",
};

export async function DiscardedCakesTable({ period }: { period: ReportPeriod }) {
    const { rows, byReason } = await getDiscardedCakes(period);

    const summary = WASTE_REASON_OPTIONS.filter((o) => byReason[o.value] > 0)
        .map((o) => `${byReason[o.value]} ${o.label.toLowerCase()}`)
        .join(", ");

    return (
        <div className="space-y-3">
            <div>
                <h2 className="text-base font-semibold">
                    Ordered cakes discarded
                </h2>
                <p className="text-sm text-muted-foreground">
                    {rows.length === 0
                        ? "No ordered cakes were discarded in this period."
                        : `${rows.length} ordered cake${rows.length === 1 ? "" : "s"
                        } discarded${summary ? ` (${summary})` : ""}.`}
                </p>
            </div>

            {rows.length > 0 && (
                <div className="overflow-x-auto rounded-md">
                    <Table className="w-full border border-border text-sm">
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead className="px-4 py-2.5 font-medium">
                                    Date
                                </TableHead>
                                <TableHead className="px-4 py-2.5 font-medium">
                                    Cake
                                </TableHead>
                                <TableHead className="px-4 py-2.5 font-medium">
                                    Customer
                                </TableHead>
                                <TableHead className="px-4 py-2.5 font-medium">
                                    Weight
                                </TableHead>
                                <TableHead className="px-4 py-2.5 font-medium">
                                    Reason
                                </TableHead>
                                <TableHead className="px-4 py-2.5 text-right font-medium">
                                    Order price
                                </TableHead>
                                <TableHead className="px-4 py-2.5 font-medium">
                                    Advance
                                </TableHead>
                                <TableHead className="px-4 py-2.5 text-right font-medium">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-border bg-muted/20">
                            {rows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        {formatDate(row.discardedAt)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {row.cakeName}
                                    </TableCell>
                                    <TableCell>{row.customerName}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.weight || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {WASTE_REASON_OPTIONS.find(
                                            (o) => o.value === row.reason
                                        )?.label ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {row.price !== null
                                            ? `Rs. ${money.format(row.price)}`
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.advance > 0
                                            ? `Rs. ${money.format(row.advance)}${row.advanceOutcome
                                                ? ` · ${OUTCOME_LABEL[
                                                row.advanceOutcome
                                                ]
                                                }`
                                                : ""
                                            }`
                                            : "None"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            nativeButton={false}
                                            render={
                                                <Link
                                                    href={`/cake-orders/${row.id}`}
                                                />
                                            }
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <p className="text-sm text-muted-foreground">
                These are custom cake orders that were made and then thrown
                away. The order price is shown for information only: it is not
                a cost and does not change income or profit.
            </p>
        </div>
    );
}