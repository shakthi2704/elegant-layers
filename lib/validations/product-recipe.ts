import { z } from "zod";

export const productRecipeItemSchema = z.object({
    recipeId: z.string().min(1, "Recipe component is required"),
    quantity: z.coerce
        .number({ message: "Quantity is required" })
        .positive("Quantity must be greater than 0"),
});

export const productRecipeSchema = z
    .object({
        components: z.array(productRecipeItemSchema),
    })
    .refine(
        (data) => {
            const ids = data.components.map((c) => c.recipeId);
            return new Set(ids).size === ids.length;
        },
        { message: "Each recipe component can only be attached once", path: ["components"] }
    );

export type ProductRecipeInput = z.infer<typeof productRecipeSchema>;