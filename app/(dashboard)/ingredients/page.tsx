import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

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
        <Button render={<Link href="/ingredients/new" />}>Add Ingredient</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Current Stock</th>
              <th className="px-4 py-2.5 font-medium">Minimum Stock</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ingredients.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-2.5 font-medium">{i.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      Number(i.currentStock) <= Number(i.minimumStock)
                        ? "font-medium text-destructive"
                        : ""
                    }
                  >
                    {i.currentStock.toString()} {i.unit}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {i.minimumStock.toString()} {i.unit}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/ingredients/${i.id}/edit`} />}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No ingredients yet. Add your first one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
