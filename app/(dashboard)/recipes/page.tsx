import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { deleteRecipe } from "@/app/(dashboard)/recipes/actions";
import { Button } from "@/components/ui/button";
import { DeleteRecipeMenuItem } from "@/components/recipes/delete-recipe-menu-item";
import {
  Card,
} from "@/components/ui/card";

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
    <div className="space-y-6 px-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Recipe Components</h1>
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
      </Card>


      <div className="overflow-hidden rounded-md">
        <Table className="w-full text-sm border border-border">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="px-4 py-2.5 font-medium">Name</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Ingredients</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Used By</TableHead>
              <TableHead className="px-4 py-2.5 text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border bg-muted/20">
            {recipes.map((recipe) => (
              <TableRow key={recipe.id}>
                <TableCell className="font-medium">{recipe.name}</TableCell>

                <TableCell className="text-muted-foreground">
                  {recipe.items.length} ingredient
                  {recipe.items.length === 1 ? "" : "s"}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {recipe.products.length} product
                  {recipe.products.length === 1 ? "" : "s"}
                </TableCell>

                <TableCell className="text-right">
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
                        render={<Link href={`/recipes/${recipe.id}/edit`} />}
                      >
                        Edit
                      </DropdownMenuItem>

                      <DeleteRecipeMenuItem
                        recipeName={recipe.name}
                        action={deleteRecipe.bind(null, recipe.id)}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {recipes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
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