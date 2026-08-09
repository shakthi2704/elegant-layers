import { z } from "zod";

export const recipeItemSchema = z.object({
    ingredientId: z.string().min(1, "Ingredient is required"),
    quantity: z.coerce
        .number({ message: "Quantity is required" })
        .positive("Quantity must be greater than 0"),
});

export const recipeSchema = z
    .object({
        productId: z.string().min(1, "Product is required"),
        items: z
            .array(recipeItemSchema)
            .min(1, "Add at least one ingredient"),
    })
    .refine(
        (data) => {
            const ids = data.items.map((i) => i.ingredientId);
            return new Set(ids).size === ids.length;
        },
        {
            message: "Each ingredient can only appear once in a recipe",
            path: ["items"],
        }
    );

export type RecipeInput = z.infer<typeof recipeSchema>;
export type RecipeItemInput = z.infer<typeof recipeItemSchema>;