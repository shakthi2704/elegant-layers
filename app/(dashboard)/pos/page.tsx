import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { POSTerminal } from "@/components/pos/pos-terminal";

export default async function POSPage() {
  await requireRole(["ADMIN", "CASHIER"]);

  const [products, categories, heldSales] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.sale.findMany({
      where: { status: "HELD" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">POS Billing</h1>
          <p className="text-base text-muted-foreground">Ring up a sale.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<Link href="/pos/history" />}
        >
          Sales History
        </Button>
      </div>

      {heldSales.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Held Bills</h2>
          <div className="flex flex-wrap gap-2  ">
            {heldSales.map((sale) => (
              <Link
                key={sale.id}
                href={`/pos/${sale.id}`}
                className="bg-secondary rounded-lg border border-border px-6 py-4 text-sm hover:bg-muted/50"
              >
                <p className="font-medium"> B/N {sale.holdLabel || sale.saleNumber}</p>
                <p className="text-muted-foreground">Rs. {sale.total.toString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <POSTerminal
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sellingPrice: p.sellingPrice.toNumber(),
          unit: p.unit,
          categoryId: p.categoryId,
          categoryName: p.category.name,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        existingSale={null}
      />
    </div>
  );
}