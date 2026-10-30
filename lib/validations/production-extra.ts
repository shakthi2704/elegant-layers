import { z } from "zod";

/** Ingredients that were used in a production run but forgotten at the time. */
export const addProductionIngredientsSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(3, "Please give a short reason")
        .max(300, "Keep the reason under 300 characters"),
    items: z
        .array(
            z.object({
                ingredientId: z.string().min(1, "Choose an ingredient"),
                quantity: z.coerce
                    .number({ message: "Enter a quantity" })
                    .min(0.001, "Quantity must be at least 0.001")
                    .max(100000, "That quantity looks too large, please check it")
                    .transform((n) => Math.round(n * 1000) / 1000),
            })
        )
        .min(1, "Add at least one ingredient")
        .max(50, "Too many ingredients at once"),
});