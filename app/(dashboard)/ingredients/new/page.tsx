import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/require-role";
import { createIngredient } from "@/app/(dashboard)/ingredients/actions";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, } from "@/components/ui/card";

export default async function NewIngredientPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6 px-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">Add Ingredient</CardTitle>
        </CardHeader>
      </Card>
      <IngredientForm action={createIngredient} submitLabel="Create Ingredient" />
    </div>
  );
}


