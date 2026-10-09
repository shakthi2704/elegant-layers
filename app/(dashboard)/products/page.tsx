import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleStatusMenuItem } from "@/components/products/toggle-status-menu-item";
import { DeleteProductMenuItem } from "@/components/products/delete-product-menu-item";
import { deleteProduct } from "@/app/(dashboard)/products/actions";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { category: categoryId } = await searchParams;

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  const products = await prisma.product.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6 px-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">Everything sellable through the POS.</p>
          </div>
          <Button nativeButton={false} render={<Link href="/products/new" />}>
            Add Product
          </Button>
        </div>
      </Card>

      <Card className="flex flex-wrap gap-2 p-4">
        <div >
          <Link
            href="/products"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              !categoryId
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                categoryId === c.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>

      </Card>

      <div className="overflow-hidden rounded-md">
        <Table className="w-full text-sm border border-border">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="px-4 py-2.5 font-medium">SKU</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Name</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Category</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Price</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Stock</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Status</TableHead>
              <TableHead className="px-4 py-2.5 text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border bg-muted/20">
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.sku}</TableCell>
                <TableCell className="text-muted-foreground">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.category.name}</TableCell>
                <TableCell>
                  Rs.{" "}
                  {Number(p.sellingPrice).toLocaleString("en-US")}
                </TableCell>

                <TableCell>
                  {p.isFinishedProduct ? (
                    <span
                      className={
                        Number(p.currentStock) <= Number(p.minimumStock)
                          ? "font-medium text-destructive"
                          : ""
                      }
                    >
                      {p.currentStock.toString()}   <span className="text-[10px]">{p.unit}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>
                    <span className="text-[10px]">{p.status}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/products/${p.id}/recipes`} />}
                    >
                      Recipe
                    </Button>
                    {p.isFinishedProduct && (
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/products/${p.id}/components`} />}
                      >
                        Base
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="size-8" />}
                      >
                        <MoreHorizontalIcon />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          nativeButton={false}
                          render={<Link href={`/products/${p.id}/edit`} />}
                        >
                          Edit
                        </DropdownMenuItem>

                        <ToggleStatusMenuItem productId={p.id} status={p.status} />

                        <DeleteProductMenuItem
                          productName={p.name}
                          action={deleteProduct.bind(null, p.id)}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {categoryId
                    ? "No products in this category."
                    : "No products yet. Add your first one to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}