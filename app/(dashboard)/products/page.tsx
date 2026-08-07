import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusToggleButton } from "@/components/products/status-toggle-button";

export default async function ProductsPage() {
  await requireRole(["ADMIN"]);

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Everything sellable through the POS.
          </p>
        </div>
        <Button render={<Link href="/products/new" />}>Add Product</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">SKU</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Price</th>
              <th className="px-4 py-2.5 font-medium">Stock</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.sku}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.category.name}</td>
                <td className="px-4 py-2.5">Rs. {p.sellingPrice.toString()}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      Number(p.currentStock) <= Number(p.minimumStock)
                        ? "font-medium text-destructive"
                        : ""
                    }
                  >
                    {p.currentStock.toString()} {p.unit}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/products/${p.id}/edit`} />}
                    >
                      Edit
                    </Button>
                    <StatusToggleButton productId={p.id} status={p.status} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No products yet. Add your first one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
