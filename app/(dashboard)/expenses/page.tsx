import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate, colomboDayStart, colomboDayEnd } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/validations/expense";
import { ExpenseFilterBar } from "@/components/expenses/expense-filter-bar";
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

const RESULT_CAP = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requireRole(["ADMIN"]);
  const { category, status, from, to } = await searchParams;

  const validFrom = from && DATE_RE.test(from) ? from : undefined;
  const validTo = to && DATE_RE.test(to) ? to : undefined;

  const where: Prisma.ExpenseWhereInput = {};

  if (category && (EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category;
  }
  if (status === "ACTIVE" || status === "VOID") {
    where.status = status;
  }
  if (validFrom || validTo) {
    where.date = {
      gte: validFrom ? colomboDayStart(validFrom) : undefined,
      lte: validTo ? colomboDayEnd(validTo) : undefined,
    };
  }

  const [expenses, matchCount, activeTotal] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { recordedBy: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: RESULT_CAP,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({
      where: { ...where, status: "ACTIVE" },
      _sum: { amount: true },
    }),
  ]);

  const total = activeTotal._sum.amount?.toNumber() ?? 0;
  const showTotal = status !== "VOID";

  return (
    <div className="space-y-6 px-6">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Expenses</h1>
            <p className="text-sm text-muted-foreground">
              Money spent on running the shop. Voided expenses are
              kept for the record but not counted.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/expenses/new" />}
          >
            Record Expense
          </Button>
        </div>

      </Card>

      {showTotal && (
        <Card className="max-w-sm p-4">
          <p className="text-sm text-muted-foreground">
            Total of active expenses
            {matchCount > RESULT_CAP ? " (all matches)" : ""}
          </p>
          <p className="text-2xl font-semibold">
            Rs. {money.format(total)}
          </p>
        </Card>
      )}
      <Card className="p-4">
        <ExpenseFilterBar
          defaults={{ category, status, from, to }}
        />

        <div className="overflow-hidden rounded-md">
          <Table className="w-full border border-border text-sm">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-4 py-2.5 font-medium">
                  Date
                </TableHead>
                <TableHead className="px-4 py-2.5 font-medium">
                  Category
                </TableHead>
                <TableHead className="px-4 py-2.5 font-medium">
                  Description
                </TableHead>
                <TableHead className="px-4 py-2.5 font-medium">
                  Paid by
                </TableHead>
                <TableHead className="px-4 py-2.5 font-medium">
                  Recorded by
                </TableHead>
                <TableHead className="px-4 py-2.5 font-medium">
                  Status
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
              {expenses.map((expense) => {
                const isVoid = expense.status === "VOID";
                return (
                  <TableRow
                    key={expense.id}
                    className={isVoid ? "text-muted-foreground" : ""}
                  >
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell className="font-medium">
                      {expense.category}
                    </TableCell>
                    <TableCell>
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell>
                      {expense.paymentMethod === "CASH"
                        ? "Cash"
                        : "Bank Deposit"}
                    </TableCell>
                    <TableCell>{expense.recordedBy.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          isVoid ? "destructive" : "secondary"
                        }
                      >
                        {isVoid ? "Void" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right ${isVoid ? "line-through" : ""
                        }`}
                    >
                      Rs. {money.format(expense.amount.toNumber())}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/expenses/${expense.id}`} />}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {expenses.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No expenses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {matchCount > RESULT_CAP && (
          <p className="text-sm text-muted-foreground">
            Showing the latest {RESULT_CAP} of {matchCount} expenses.
            Use the filters to narrow the list.
          </p>
        )}
      </Card>

    </div>
  );
}