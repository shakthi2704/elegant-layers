import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  unit: z.enum(["KG", "G", "L", "ML", "PCS"]),
  minimumStock: z.coerce.number().min(0).default(0),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
