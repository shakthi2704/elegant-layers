"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { ingredientSchema } from "@/lib/validations/ingredient";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    unit: formData.get("unit"),
    minimumStock: formData.get("minimumStock") || 0,
  };
}

export async function createIngredient(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const parsed = ingredientSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.ingredient.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return { fieldErrors: { name: ["An ingredient with this name already exists."] } };
  }

  await prisma.ingredient.create({ data: parsed.data });

  revalidatePath("/ingredients");
  return { success: true };
}

export async function updateIngredient(
  ingredientId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(["ADMIN"]);

  const parsed = ingredientSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.ingredient.findFirst({
    where: { name: parsed.data.name, NOT: { id: ingredientId } },
  });
  if (existing) {
    return { fieldErrors: { name: ["An ingredient with this name already exists."] } };
  }

  await prisma.ingredient.update({
    where: { id: ingredientId },
    data: parsed.data,
  });

  revalidatePath("/ingredients");
  revalidatePath(`/ingredients/${ingredientId}/edit`);
  return {};
}
