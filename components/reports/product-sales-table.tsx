import Link from "next/link";

import { getProductSales, type ReportPeriod } from "@/lib/reports";
import { formatDate } from "@/lib/format";
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
    const { rows, totals, complimentaryBills, cakeOrders } =
        await getProductSales(period);

    const hasCakeGiveaways =
        cakeOrders.discountOrders > 0 ||
        cakeOrders.complimentaryOrders.length > 0;

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="overflow-x-auto rounded-md">
                    <Table className="w-full border border-border text-sm">
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead className="px-4 py-2.5 font-medium">
                                    Product
                                </TableHead>
                                <TableHead className="px-4 py-2.5 text-right font-medium">
                                    Quantity
                                </TableHead>
                                <TableHead className="px-4 py-2.5 text-right font-medium">
                                    Complimentary
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
                                        {row.freeQuantity > 0 ? (
                                            <>
                                                {qtyFormat.format(row.freeQuantity)}{" "}
                                                {UNIT_LABELS[row.unit] ?? row.unit}
                                                {/* <span className="block text-xs text-muted-foreground">
                                                    Rs. {money.format(row.freeValue)}
                                                </span> */}
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        Rs. {money.format(row.revenue)}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
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
                                    <TableCell colSpan={3}>
                                        Total of all items ({totals.billCount} bill
                                        {totals.billCount === 1 ? "" : "s"})
                                    </TableCell>
                                    <TableCell className="text-right">
                                        Rs. {money.format(totals.itemRevenue)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        Discounts given on whole bills
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {totals.billDiscounts > 0
                                            ? `(Rs. ${money.format(totals.billDiscounts)})`
                                            : `Rs. ${money.format(0)}`}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="font-semibold">
                                    <TableCell colSpan={3}>
                                        POS income for the period
                                    </TableCell>
                                    <TableCell className="text-right">
                                        Rs. {money.format(totals.posTotal)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="text-muted-foreground">
                                    <TableCell colSpan={3}>
                                        Value of complimentary items (given free,
                                        not part of income)
                                    </TableCell>
                                    <TableCell className="text-right">
                                        Rs. {money.format(totals.complimentaryValue)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>

                <p className="text-sm text-muted-foreground">
                    POS bills only. Quantity counts everything that left the
                    shop, including complimentary items, so it matches the stock.
                    Revenue is after any discount on a single item and excludes
                    complimentary items. A discount on a whole bill is shown
                    separately at the bottom. Voided and held bills are not
                    counted.
                </p>
            </div>

            {complimentaryBills.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-sm font-medium">
                        POS bills with complimentary items
                    </h2>
                    <div className="overflow-x-auto rounded-md">
                        <Table className="w-full border border-border text-sm">
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Bill
                                    </TableHead>
                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Date
                                    </TableHead>
                                    <TableHead className="px-4 py-2.5 font-medium">
                                        Reason
                                    </TableHead>
                                    <TableHead className="px-4 py-2.5 text-right font-medium">
                                        Value given free
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border bg-muted/20">
                                {complimentaryBills.map((bill) => (
                                    <TableRow key={bill.saleId}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/pos/${bill.saleId}`}
                                                className="text-primary underline-offset-4 hover:underline"
                                            >
                                                {bill.saleNumber}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(bill.date)}
                                        </TableCell>
                                        <TableCell>{bill.reason}</TableCell>
                                        <TableCell className="text-right">
                                            Rs. {money.format(bill.value)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <h2 className="text-sm font-medium">
                    Cake orders: discounts and complimentary
                </h2>
                <p className="text-sm text-muted-foreground">
                    Orders placed in this period, not counting cancelled ones.
                </p>

                {!hasCakeGiveaways ? (
                    <p className="rounded-md border border-border px-4 py-6 text-center text-sm text-muted-foreground">
                        No discounts or complimentary cake orders in this period.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <div className="overflow-x-auto rounded-md">
                            <Table className="w-full border border-border text-sm">
                                <TableBody className="divide-y divide-border bg-muted/20">
                                    <TableRow>
                                        <TableCell>
                                            Discounts given (
                                            {cakeOrders.discountOrders} order
                                            {cakeOrders.discountOrders === 1 ? "" : "s"})
                                        </TableCell>
                                        <TableCell className="text-right">
                                            Rs. {money.format(cakeOrders.discountTotal)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            Complimentary orders (
                                            {cakeOrders.complimentaryOrders.length}) —
                                            value given free
                                        </TableCell>
                                        <TableCell className="text-right">
                                            Rs.{" "}
                                            {money.format(cakeOrders.complimentaryValue)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {cakeOrders.complimentaryOrders.length > 0 && (
                            <div className="overflow-x-auto rounded-md">
                                <Table className="w-full border border-border text-sm">
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="px-4 py-2.5 font-medium">
                                                Cake
                                            </TableHead>
                                            <TableHead className="px-4 py-2.5 font-medium">
                                                Customer
                                            </TableHead>
                                            <TableHead className="px-4 py-2.5 font-medium">
                                                Placed
                                            </TableHead>
                                            <TableHead className="px-4 py-2.5 font-medium">
                                                Reason
                                            </TableHead>
                                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                                Value given free
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border bg-muted/20">
                                        {cakeOrders.complimentaryOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={`/cake-orders/${order.id}`}
                                                        className="text-primary underline-offset-4 hover:underline"
                                                    >
                                                        {order.cakeName}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{order.customerName}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(order.date)}
                                                </TableCell>
                                                <TableCell>{order.reason}</TableCell>
                                                <TableCell className="text-right">
                                                    Rs. {money.format(order.value)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}