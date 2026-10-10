import Link from "next/link";

import { getWasteReport, type ReportPeriod } from "@/lib/reports";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const qtyFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
});

const UNIT_LABELS: Record<string, string> = {
    KG: "kg",
    G: "g",
    L: "L",
    ML: "ml",
    PCS: "pcs",
};

function qty(value: number, unit: string) {
    if (value === 0) return "—";
    return `${qtyFormat.format(value)} ${UNIT_LABELS[unit] ?? unit}`;
}

export async function WasteTable({ period }: { period: ReportPeriod }) {
    const { rows, totalEntries } = await getWasteReport(period);

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-md">
                <Table className="w-full border border-border text-sm">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Item
                            </TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Type
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Expired
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Not collected
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Damaged
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Other
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Total
                            </TableHead>
                            {/* <TableHead className="px-4 py-2.5 text-right font-medium">
                                Entries
                            </TableHead> */}
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border bg-muted/20">
                        {rows.map((row) => (
                            <TableRow key={row.key}>
                                <TableCell className="font-medium">
                                    {row.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {row.kind}
                                </TableCell>
                                <TableCell className="text-right">
                                    {qty(row.byReason.EXPIRED, row.unit)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {qty(row.byReason.NOT_COLLECTED, row.unit)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {qty(row.byReason.DAMAGED, row.unit)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {qty(row.byReason.OTHER, row.unit)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {qty(row.total, row.unit)}
                                </TableCell>
                                {/* <TableCell className="text-right text-muted-foreground">
                                    {row.entries}
                                </TableCell> */}
                            </TableRow>
                        ))}

                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No waste recorded in this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalEntries > 0 && (
                <Link
                    href={`/inventory?view=movements&type=WASTE&from=${period.from}&to=${period.to}`}
                    className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                    See each waste entry ({totalEntries})
                </Link>
            )}

            <p className="text-sm text-muted-foreground">
                Quantities only. Waste does not change income, expenses or
                profit, because the cost of these items was already counted
                when they were bought. It is recorded so stock stays correct
                and the owners can see how much is thrown away.
            </p>
        </div>
    );
}