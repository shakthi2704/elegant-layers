import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateIngredient } from "@/app/(dashboard)/ingredients/actions";
import { IngredientForm } from "@/components/ingredients/ingredient-form";

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({ where: { id } });
  if (!ingredient) {
    notFound();
  }

  const boundUpdate = updateIngredient.bind(null, ingredient.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Edit Ingredient</h1>
        <p className="text-sm text-muted-foreground">
          Current stock: {ingredient.currentStock.toString()} {ingredient.unit}
        </p>
      </div>
      <IngredientForm
        action={boundUpdate}
        submitLabel="Save Changes"
        defaultValues={{
          name: ingredient.name,
          unit: ingredient.unit,
          minimumStock: ingredient.minimumStock.toString(),
        }}
      />
    </div>
  );
}
