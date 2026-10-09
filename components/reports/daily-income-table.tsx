import Link from "next/link";

import { formatDate, colomboDayStart } from "@/lib/format";
import { getDailyIncome, type ReportPeriod } from "@/lib/reports";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const money = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export async function DailyIncomeTable({ period }: { period: ReportPeriod }) {
    const { rows, totals } = await getDailyIncome(period);

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-md">
                <Table className="w-full border border-border text-sm">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Date
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                POS bills
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                POS total
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Cake advances
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Cake balances
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Day total
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border bg-muted/20">
                        {rows.map((row) => (
                            <TableRow key={row.date}>
                                <TableCell className="font-medium">
                                    {formatDate(colomboDayStart(row.date))}
                                </TableCell>
                                <TableCell className="text-right">
                                    {row.posCount}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(row.pos)}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(row.cakeAdvance)}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(row.cakeBalance)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    Rs. {money.format(row.total)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        nativeButton={false}
                                        render={
                                            <Link
                                                href={`/income?from=${row.date}&to=${row.date}`}
                                            />
                                        }
                                    >
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No income in this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                    {rows.length > 0 && (
                        <TableFooter className="bg-muted font-semibold">
                            <TableRow>
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">
                                    {totals.posCount}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(totals.pos)}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(totals.cakeAdvance)}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(totals.cakeBalance)}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(totals.total)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>

            <p className="text-sm text-muted-foreground">
                advances on the day the order was created, and cake balances on
                the day the order was collected. An advance the shop kept on a
                cancelled order counts on the day that was recorded. Days with
                no income are not listed.
            </p>
        </div>
    );
}