import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/layout/table-pagination";
import { PAGE_SIZE, clampPage, parsePage } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
} from "@/components/ui/card";

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { page } = await searchParams;

  const total = await prisma.production.count();
  const currentPage = clampPage(parsePage(page), total);

  const productions = await prisma.production.findMany({
    include: { items: { include: { product: true } } },
    // createdAt and id break ties so rows never repeat or vanish between pages.
    orderBy: [
      { productionDate: "desc" },
      { createdAt: "desc" },
      { id: "desc" },
    ],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="space-y-6 px-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Production</h1>
            <p className="text-sm text-muted-foreground">
              Records that consume ingredients per recipe and increase
              product stock.
            </p>
          </div>

          <Button
            nativeButton={false}
            render={<Link href="/production/new" />}
          >
            Record Production
          </Button>
        </div>
      </Card>

      <div className="overflow-hidden rounded-md">
        <Table className="w-full border border-border text-sm">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="px-4 py-2.5 font-medium">
                Date
              </TableHead>

              <TableHead className="px-4 py-2.5 font-medium">
                Products
              </TableHead>

              <TableHead className="px-4 py-2.5 text-right font-medium">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border bg-muted/20">
            {productions.map((production) => {
              const lines = production.items.map(
                (item) =>
                ({
                  text: `${item.product.name} (${item.quantityProduced.toString()})`,
                  inactive: item.product.status === "INACTIVE",
                })
              );

              return (
                <TableRow key={production.id}>
                  <TableCell className="px-4 py-2.5 text-muted-foreground">
                    {formatDate(production.productionDate)}
                  </TableCell>

                  <TableCell className="px-4 py-2.5 font-medium">
                    {lines.map((line, i) => (
                      <div key={i}>
                        {line.text}
                        {line.inactive && (
                          <Badge
                            variant="outline"
                            className="ml-2 px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                    ))}
                  </TableCell>

                  <TableCell className="px-4 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link href={`/production/${production.id}`} />
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {productions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No production recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="pt-3">
          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/production"
            params={{}}
          />
        </div>
      </div>
    </div>
  );
}
