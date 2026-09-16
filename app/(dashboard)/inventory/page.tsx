import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InventoryPage() {
  await requireRole(["ADMIN"]);

  const adjustments = await prisma.inventoryTransaction.findMany({
    where: { type: "ADJUSTMENT" },
    include: { ingredient: true, product: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory Adjustments</h1>
          <p className="text-sm text-muted-foreground">
            Manual stock corrections — for recounts or fixing a mistake elsewhere.
            Each entry is permanent once saved.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/inventory/new" />}>
          New Adjustment
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>New Stock</TableHead>
              <TableHead>By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((txn) => {
              const item = txn.ingredient ?? txn.product;
              const quantity = txn.quantity.toNumber();

              return (
                <TableRow key={txn.id}>
                  <TableCell className="text-muted-foreground">
                    {txn.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{item?.name}</TableCell>
                  <TableCell className={quantity >= 0 ? "text-emerald-500" : "text-destructive"}>
                    {quantity >= 0 ? "+" : ""}
                    {txn.quantity.toString()} {item?.unit}
                  </TableCell>
                  <TableCell>
                    {txn.balanceAfter.toString()} {item?.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {txn.createdBy.name}
                  </TableCell>
                  <TableCell className="text-right">
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
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No adjustments recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}