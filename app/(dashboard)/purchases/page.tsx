import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
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
    <div className="space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Purchases</h1>
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
                  Rs.{" "}
                  {Number(purchase.totalAmount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>


                <TableCell className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href={`/purchases/${purchase.id}`} />
                    }
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
