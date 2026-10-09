import Link from "next/link";

import { formatDate, colomboDayStart } from "@/lib/format";
import { getProfitSummary, type ReportPeriod } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const money = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function rs(n: number) {
    return n < 0 ? `-Rs. ${money.format(Math.abs(n))}` : `Rs. ${money.format(n)}`;
}

function Line({
    label,
    amount,
    href,
    indent = false,
    strong = false,
    muted = false,
    minus = false,
}: {
    label: string;
    amount: number;
    href?: string;
    indent?: boolean;
    strong?: boolean;
    muted?: boolean;
    /** Show as a deduction, e.g. "(Rs. 500.00)". */
    minus?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex items-baseline justify-between gap-4 py-1.5",
                indent && "pl-6",
                strong && "font-semibold",
                muted && "text-sm text-muted-foreground"
            )}
        >
            {href ? (
                <Link href={href} className="hover:underline">
                    {label}
                </Link>
            ) : (
                <span>{label}</span>
            )}
            <span className="tabular-nums">
                {minus && amount > 0 ? `(${rs(amount)})` : rs(amount)}
            </span>
        </div>
    );
}

export async function ProfitSummary({ period }: { period: ReportPeriod }) {
    const s = await getProfitSummary(period);
    const qs = `from=${period.from}&to=${period.to}`;

    const profitClass = (n: number) =>
        n < 0 ? "text-destructive" : "text-green-600 dark:text-green-400";

    return (
        <div className="space-y-6">
            <Card className="max-w-full p-6">
                <p className="pb-2 text-sm text-muted-foreground">
                    {formatDate(colomboDayStart(period.from))} to{" "}
                    {formatDate(colomboDayStart(period.to))}
                </p>

                {/* Income */}
                <p className="pt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Income
                </p>
                <Line label="POS bills" amount={s.income.pos} indent />
                <Line label="Cake order advances" amount={s.income.cakeAdvance} indent />
                <Line label="Cake order balances" amount={s.income.cakeBalance} indent />
                <div className="border-t">
                    <Line
                        label="Total income"
                        amount={s.income.total}
                        href={`/income?${qs}`}
                        strong
                    />
                </div>

                {/* Purchases */}
                <p className="pt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Purchases
                </p>
                <Line
                    label={`Stock bought (${s.purchases.count} purchase${s.purchases.count === 1 ? "" : "s"
                        })`}
                    amount={s.purchases.total}
                    href={`/purchases?${qs}`}
                    minus
                />

                {/* Expenses */}
                <p className="pt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Expenses
                </p>
                {s.expenses.byCategory.map((c) => (
                    <Line
                        key={c.category}
                        label={c.category}
                        amount={c.total}
                        indent
                        minus
                    />
                ))}
                {s.expenses.byCategory.length === 0 && (
                    <p className="py-1.5 pl-6 text-sm text-muted-foreground">
                        No expenses in this period.
                    </p>
                )}
                <div className="border-t">
                    <Line
                        label="Total expenses"
                        amount={s.expenses.total}
                        href={`/expenses?status=ACTIVE&${qs}`}
                        strong
                        minus
                    />
                </div>

                {/* Profit before depreciation */}
                <div className="mt-4 border-t-2 pt-2">
                    <div className={profitClass(s.profitBeforeDepreciation)}>
                        <Line
                            label="Profit before depreciation"
                            amount={s.profitBeforeDepreciation}
                            strong
                        />
                    </div>
                </div>

                {/* Depreciation */}
                <p className="pt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Depreciation
                </p>
                {s.depreciation.assets.map((a) => (
                    <Line
                        key={a.id}
                        label={a.name}
                        amount={a.amount}
                        href={`/fixed-assets/${a.id}`}
                        indent
                        minus
                    />
                ))}
                {s.depreciation.assets.length === 0 && (
                    <p className="py-1.5 pl-6 text-sm text-muted-foreground">
                        No depreciation fell in this period.
                    </p>
                )}
                <div className="border-t">
                    <Line
                        label="Total depreciation"
                        amount={s.depreciation.total}
                        strong
                        minus
                    />
                </div>

                {/* Final profit */}
                <div className="mt-4 border-t-2 pt-2">
                    <div
                        className={cn(
                            "text-lg",
                            profitClass(s.profitAfterDepreciation)
                        )}
                    >
                        <Line
                            label="Profit after depreciation"
                            amount={s.profitAfterDepreciation}
                            strong
                        />
                    </div>
                </div>
            </Card>

            {s.income.heldOnCancelled.count > 0 && (
                <div className="max-w-2xl rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Not counted as income: {rs(s.income.heldOnCancelled.amount)}{" "}
                    in advances held on {s.income.heldOnCancelled.count}{" "}
                    cancelled order
                    {s.income.heldOnCancelled.count === 1 ? "" : "s"}, until it
                    is decided whether they are kept or refunded.
                </div>
            )}

            {s.income.noPriceCount > 0 && (
                <div className="max-w-full rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                    {s.income.noPriceCount} collected cake order
                    {s.income.noPriceCount === 1 ? " has" : "s have"} no price
                    set, so no balance was counted for{" "}
                    {s.income.noPriceCount === 1 ? "it" : "them"}.
                </div>
            )}

            <div className="max-w-full space-y-1 text-sm text-muted-foreground">
                <p>
                    Purchases are counted in the month the stock is bought, not
                    when it is used. A large purchase lowers that month&apos;s
                    profit even if the stock is still on the shelf.
                </p>
                <p>
                    Depreciation is calculated one full month at a time, so a
                    short date range may show none or a whole month&apos;s
                    amount.
                </p>
            </div>
        </div>
    );
}