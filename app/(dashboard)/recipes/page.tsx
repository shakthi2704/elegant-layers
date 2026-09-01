import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { deleteRecipe } from "@/app/(dashboard)/recipes/actions";
import { Button } from "@/components/ui/button";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
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

  const recipes = await prisma.recipe.findMany({
    include: {
      items: true,
      products: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Recipe Components</h1>
          <p className="text-sm text-muted-foreground">
            Reusable building blocks (e.g. &quot;Butter Cake Base&quot;,
            &quot;Vanilla Icing&quot;). Attach one or more to a product to
            define what it&apos;s made of.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/recipes/new" />}>
          Add Recipe Component
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Ingredients</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((recipe) => (
              <TableRow key={recipe.id}>
                <TableCell className="font-medium">{recipe.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {recipe.items.length} ingredient{recipe.items.length === 1 ? "" : "s"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {recipe.products.length} product{recipe.products.length === 1 ? "" : "s"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/recipes/${recipe.id}/edit`} />}
                    >
                      Edit
                    </Button>
                    <DeleteRecipeButton
                      recipeName={recipe.name}
                      action={deleteRecipe.bind(null, recipe.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {recipes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No recipe components yet. Add your first one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}