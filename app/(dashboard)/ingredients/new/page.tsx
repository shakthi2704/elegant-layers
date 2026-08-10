import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/require-role";
import { createIngredient } from "@/app/(dashboard)/ingredients/actions";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Button } from "@/components/ui/button";

export default async function NewIngredientPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Add Ingredient</h1>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/ingredients" />}
        >
          <ArrowLeft className="size-4" />
          Back to Ingredients
        </Button>
      </div>
      <IngredientForm action={createIngredient} submitLabel="Create Ingredient" />
    </div>
  );
}