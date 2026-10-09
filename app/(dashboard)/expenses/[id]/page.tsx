import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { VoidExpenseButton } from "@/components/expenses/void-expense-button";

const money = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export default async function ExpenseDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const expense = await prisma.expense.findUnique({
        where: { id },
        include: {
            recordedBy: { select: { name: true } },
            voidedBy: { select: { name: true } },
        },
    });
    if (!expense) {
        notFound();
    }

    const isVoid = expense.status === "VOID";

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl">
                                {expense.category} expense
                            </CardTitle>
                            <CardDescription>
                                {formatDate(expense.date)} · Rs.{" "}
                                {money.format(expense.amount.toNumber())}
                            </CardDescription>
                        </div>
                        <Badge variant={isVoid ? "destructive" : "secondary"}>
                            {isVoid ? "Void" : "Active"}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-muted-foreground">Category</dt>
                            <dd className="font-medium">{expense.category}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Date</dt>
                            <dd className="font-medium">
                                {formatDate(expense.date)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Amount</dt>
                            <dd className="font-medium">
                                Rs. {money.format(expense.amount.toNumber())}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Paid by</dt>
                            <dd className="font-medium">
                                {expense.paymentMethod === "CASH"
                                    ? "Cash"
                                    : "Bank Deposit"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Recorded by</dt>
                            <dd className="font-medium">
                                {expense.recordedBy.name}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Recorded on</dt>
                            <dd className="font-medium">
                                {formatDateTime(expense.createdAt)}
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-muted-foreground">Description</dt>
                            <dd className="font-medium">
                                {expense.description || "—"}
                            </dd>
                        </div>
                    </dl>

                    {isVoid && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
                            <p className="font-medium text-destructive">Voided</p>
                            <p className="text-muted-foreground">
                                By {expense.voidedBy?.name ?? "unknown"}
                                {expense.voidedAt
                                    ? ` on ${formatDateTime(expense.voidedAt)}`
                                    : ""}
                            </p>
                            <p className="mt-2">{expense.voidReason}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t pt-6">
                        <Button
                            variant="outline"
                            nativeButton={false}
                            render={<Link href="/expenses" />}
                        >
                            Back to Expenses
                        </Button>

                        {!isVoid && (
                            <VoidExpenseButton
                                expenseId={expense.id}
                                expenseLabel={`${expense.category} expense`}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}