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

export default async function ProductionPage() {
  await requireRole(["ADMIN"]);

  const productions = await prisma.production.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { productionDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Production</h1>
          <p className="text-sm text-muted-foreground">
            Records that consume ingredients per recipe and increase product stock.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/production/new" />}>
          Record Production
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productions.map((production) => {
              const summary = production.items
                .map((item) => `${item.product.name} (${item.quantityProduced.toString()})`)
                .join(", ");

              return (
                <TableRow key={production.id}>
                  <TableCell className="text-muted-foreground">
                    {production.productionDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{summary}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/production/${production.id}`} />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {productions.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No production recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}