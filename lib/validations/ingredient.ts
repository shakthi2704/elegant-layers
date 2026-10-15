import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  unit: z.enum(["KG", "G", "L", "ML", "PCS"]),
  kind: z.enum(["INGREDIENT", "SUPPLY"]).default("INGREDIENT"),
  minimumStock: z.coerce.number().min(0).default(0),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
