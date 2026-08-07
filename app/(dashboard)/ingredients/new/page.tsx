import { requireRole } from "@/lib/require-role";
import { createIngredient } from "@/app/(dashboard)/ingredients/actions";
import { IngredientForm } from "@/components/ingredients/ingredient-form";

export default async function NewIngredientPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Add Ingredient</h1>
      </div>
      <IngredientForm action={createIngredient} submitLabel="Create Ingredient" />
    </div>
  );
}
