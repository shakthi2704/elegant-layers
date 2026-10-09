import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate, colomboDayStart, colomboDayEnd } from "@/lib/format";
import { PurchaseFilterBar } from "@/components/purchases/purchase-filter-bar";
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

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string; from?: string; to?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { supplier, from, to } = await searchParams;

  const validFrom = from && DATE_RE.test(from) ? from : undefined;
  const validTo = to && DATE_RE.test(to) ? to : undefined;

  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const where: Prisma.PurchaseWhereInput = {};

  if (supplier && suppliers.some((s) => s.id === supplier)) {
    where.supplierId = supplier;
  }
  if (validFrom || validTo) {
    where.purchaseDate = {
      gte: validFrom ? colomboDayStart(validFrom) : undefined,
      lte: validTo ? colomboDayEnd(validTo) : undefined,
    };
  }

  const [purchases, matchCount, totalAgg] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: { supplier: true, items: true },
      orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
      take: RESULT_CAP,
    }),
    prisma.purchase.count({ where }),
    prisma.purchase.aggregate({ where, _sum: { totalAmount: true } }),
  ]);

  const total = totalAgg._sum.totalAmount?.toNumber() ?? 0;

  return (
    <div className="space-y-6 px-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Purchases</h1>
            <p className="text-sm text-muted-foreground">
              Ingredient and product purchases from suppliers. Each entry
              increases stock.
            </p>
          </div>

          <Button
            nativeButton={false}
            render={<Link href="/purchases/new" />}
          >
            Record Purchase
          </Button>
        </div>

      </Card>
      <Card className="max-w-sm p-4">

        <p className="text-sm text-muted-foreground">
          Total purchases ({matchCount} purchase
          {matchCount === 1 ? "" : "s"})
        </p>
        <p className="text-2xl font-semibold">Rs. {money.format(total)}</p>
      </Card>

      <Card className="p-4">
        <PurchaseFilterBar
          suppliers={suppliers}
          defaults={{ supplier, from, to }}
        />

        <div className="overflow-hidden rounded-md">
          <Table className="w-full border border-border text-sm">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-4 py-2.5 font-medium">
                  Date
                </TableHead>

                <TableHead className="px-4 py-2.5 font-medium">
                  Supplier
                </TableHead>

                <TableHead className="px-4 py-2.5 font-medium">
                  Items
                </TableHead>

                <TableHead className="px-4 py-2.5 text-right font-medium">
                  Total
                </TableHead>

                <TableHead className="px-4 py-2.5 text-right font-medium">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border bg-muted/20">
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="px-4 py-2.5 text-muted-foreground">
                    {formatDate(purchase.purchaseDate)}
                  </TableCell>

                  <TableCell className="px-4 py-2.5 font-medium">
                    {purchase.supplier.name}
                  </TableCell>

                  <TableCell className="px-4 py-2.5 text-muted-foreground">
                    {purchase.items.length} item
                    {purchase.items.length === 1 ? "" : "s"}
                  </TableCell>

                  <TableCell className="px-4 py-2.5 text-right">
                    Rs. {money.format(purchase.totalAmount.toNumber())}
                  </TableCell>

                  <TableCell className="px-4 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/purchases/${purchase.id}`} />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {purchases.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {matchCount === 0 && !supplier && !validFrom && !validTo
                      ? "No purchases recorded yet."
                      : "No purchases found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {matchCount > RESULT_CAP && (
          <p className="text-sm text-muted-foreground">
            Showing the latest {RESULT_CAP} of {matchCount} purchases. The total
            above covers all of them. Use the filters to narrow the list.
          </p>
        )}
      </Card>



    </div>
  );
}