import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  InventoryTabs,
  parseInventoryView,
} from "@/components/inventory/inventory-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockTable } from "@/components/inventory/stock-table";
import { MovementsTable } from "@/components/inventory/movements-table";
import { MovementFilterBar } from "@/components/inventory/movement-filter-bar";

import { StockFilterBar } from "@/components/inventory/stock-filter-bar";

import {
  Card,
} from "@/components/ui/card";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    type?: string;
    from?: string;
    to?: string;
    q?: string;
    low?: string;
  }>;
}) {
  await requireRole(["ADMIN"]);
  const { view: rawView, type, from, to, q, low } = await searchParams;
  const view = parseInventoryView(rawView);

  // Only load adjustments when that tab is open.
  const adjustments =
    view === "adjustments"
      ? await prisma.inventoryTransaction.findMany({
        where: { type: "ADJUSTMENT" },
        include: { ingredient: true, product: true, createdBy: true },
        orderBy: { createdAt: "desc" },
      })
      : [];

  return (
    <div className="space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Current stock, every stock movement, and manual corrections.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/inventory/new" />}
        >
          New Adjustment
        </Button>
      </div>
      <Card className="flex flex-wrap gap-2 p-4">
        <InventoryTabs active={view} />
      </Card>


      {view === "stock" && (
        <>
          <StockFilterBar defaults={{ type, low, q }} />
          <StockTable filters={{ type, low, q }} />
        </>
      )}
      {view === "movements" && (
        <>
          <MovementFilterBar defaults={{ type, from, to, q }} />
          <MovementsTable filters={{ type, from, to, q }} />
        </>
      )}
      {view === "adjustments" && (
        <div className="overflow-hidden rounded-md">
          <Table className="w-full border border-border text-sm">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-4 py-2.5 font-medium">Date</TableHead>
                <TableHead className="px-4 py-2.5 font-medium">Item</TableHead>
                <TableHead className="px-4 py-2.5 font-medium">Change</TableHead>
                <TableHead className="px-4 py-2.5 font-medium">New Stock</TableHead>
                <TableHead className="px-4 py-2.5 font-medium">By</TableHead>
                <TableHead className="px-4 py-2.5 text-right font-medium">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border bg-muted/20">
              {adjustments.map((txn) => {
                const item = txn.ingredient ?? txn.product;
                const quantity = txn.quantity.toNumber();

                return (
                  <TableRow key={txn.id}>
                    <TableCell className="px-4 py-2.5 text-muted-foreground">
                      {formatDate(txn.createdAt)}
                    </TableCell>

                    <TableCell className="px-4 py-2.5 font-medium">
                      {item?.name}
                    </TableCell>

                    <TableCell
                      className={`px-4 py-2.5 ${quantity >= 0 ? "text-emerald-500" : "text-destructive"
                        }`}
                    >
                      {quantity >= 0 ? "+" : ""}
                      {txn.quantity.toString()} {item?.unit}
                    </TableCell>

                    <TableCell className="px-4 py-2.5">
                      {txn.balanceAfter.toString()} {item?.unit}
                    </TableCell>

                    <TableCell className="px-4 py-2.5 text-muted-foreground">
                      {txn.createdBy.name}
                    </TableCell>

                    <TableCell className="px-4 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/inventory/${txn.id}`} />}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {adjustments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No adjustments recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}