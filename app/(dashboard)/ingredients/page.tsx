import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { deleteIngredient } from "@/app/(dashboard)/ingredients/actions";
import { DeleteIngredientMenuItem } from "@/components/ingredients/delete-ingredient-menu-item";

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

export default async function IngredientsPage() {
  await requireRole(["ADMIN"]);

  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ingredients</h1>
          <p className="text-sm text-muted-foreground">
            Raw materials used in recipes and consumed by Production.
          </p>
        </div>
        <Button
          variant="default"
          size="lg"
          nativeButton={false}
          render={<Link href="/ingredients/new" />}
        >
          Add Ingredient
        </Button>
      </div>

      <div className="overflow-hidden rounded-md">
        <Table className="w-full text-sm border border-border">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="px-4 py-2.5 font-medium">Name</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Current Stock</TableHead>
              <TableHead className="px-4 py-2.5 font-medium">Minimum Stock</TableHead>
              <TableHead className="px-4 py-2.5 text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border bg-muted/20">
            {ingredients.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>

                <TableCell>
                  <span
                    className={
                      Number(i.currentStock) <= Number(i.minimumStock)
                        ? "font-medium text-destructive"
                        : "font-medium text-green-600"
                    }
                  >
                    {i.currentStock.toString()} {i.unit}
                  </span>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {i.minimumStock.toString()} {i.unit}
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
                        render={<Link href={`/ingredients/${i.id}/edit`} />}
                      >
                        Edit
                      </DropdownMenuItem>

                      <DeleteIngredientMenuItem
                        ingredientName={i.name}
                        action={deleteIngredient.bind(null, i.id)}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {ingredients.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  No ingredients yet. Add your first one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}