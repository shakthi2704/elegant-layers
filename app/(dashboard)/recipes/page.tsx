import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function RecipesPage() {
  await requireRole(["ADMIN"]);

  const products = await prisma.product.findMany({
    where: { isFinishedProduct: true, status: "ACTIVE" },
    include: {
      category: true,
      recipe: { include: { items: true } },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Recipes</h1>
        <p className="text-sm text-muted-foreground">
          Define which ingredients — and how much of each — go into one unit of a
          Production-tracked product.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Ingredients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const itemCount = product.recipe?.items.length ?? 0;
              const hasRecipe = itemCount > 0;

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {hasRecipe
                      ? `${itemCount} ingredient${itemCount === 1 ? "" : "s"}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {hasRecipe ? (
                      <Badge variant="secondary">Defined</Badge>
                    ) : (
                      <Badge variant="destructive">Not set</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/recipes/${product.id}`} />}
                    >
                      {hasRecipe ? "Edit Recipe" : "Add Recipe"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No Production-tracked products yet. Mark a product as
                  &quot;Finished Product&quot; to define a recipe for it.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}