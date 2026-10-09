import { getProductSales, type ReportPeriod } from "@/lib/reports";
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

export async function ProductSalesTable({ period }: { period: ReportPeriod }) {
    const { rows, totals } = await getProductSales(period);

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-md">
                <Table className="w-full border border-border text-sm">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Product
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Quantity sold
                            </TableHead>
                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Revenue
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border bg-muted/20">
                        {rows.map((row) => (
                            <TableRow key={row.productId}>
                                <TableCell className="font-medium">
                                    {row.name}
                                </TableCell>
                                <TableCell className="text-right">
                                    {qtyFormat.format(row.quantity)}{" "}
                                    {UNIT_LABELS[row.unit] ?? row.unit}
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(row.revenue)}
                                </TableCell>
                            </TableRow>
                        ))}

                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No POS sales in this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                    {rows.length > 0 && (
                        <TableFooter className="bg-muted">
                            <TableRow>
                                <TableCell colSpan={2}>
                                    Total of all items ({totals.billCount} bill
                                    {totals.billCount === 1 ? "" : "s"})
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(totals.itemRevenue)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    Discounts given on whole bills
                                </TableCell>
                                <TableCell className="text-right">
                                    {totals.billDiscounts > 0
                                        ? `(Rs. ${money.format(totals.billDiscounts)})`
                                        : `Rs. ${money.format(0)}`}
                                </TableCell>
                            </TableRow>
                            <TableRow className="font-semibold">
                                <TableCell colSpan={2}>
                                    POS income for the period
                                </TableCell>
                                <TableCell className="text-right">
                                    Rs. {money.format(totals.posTotal)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </div>

            <p className="text-sm text-muted-foreground">
                POS bills only: cake orders are not listed here because they
                don&apos;t have product lines. Revenue is after any discount on
                a single item. A discount on a whole bill is shown separately
                at the bottom. Voided and held bills are not counted.
            </p>
        </div>
    );
}