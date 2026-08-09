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

export default async function PurchasesPage() {
  await requireRole(["ADMIN"]);

  const purchases = await prisma.purchase.findMany({
    include: { supplier: true, items: true },
    orderBy: { purchaseDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Purchases</h1>
          <p className="text-sm text-muted-foreground">
            Ingredient purchases from suppliers. Each entry increases stock.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/purchases/new" />}>
          Record Purchase
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="text-muted-foreground">
                  {purchase.purchaseDate.toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">{purchase.supplier.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {purchase.items.length} item{purchase.items.length === 1 ? "" : "s"}
                </TableCell>
                <TableCell>Rs. {purchase.totalAmount.toString()}</TableCell>
                <TableCell className="text-right">
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
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No purchases recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}