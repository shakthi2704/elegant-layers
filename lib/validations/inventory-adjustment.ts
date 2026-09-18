import { z } from "zod";

export const inventoryAdjustmentSchema = z.object({
    itemType: z.enum(["INGREDIENT", "PRODUCT"], {
        message: "Choose whether this is an ingredient or a product",
    }),
    itemId: z.string().min(1, "Select an item"),
    newStock: z.coerce
        .number({ message: "New stock amount is required" })
        .min(0, "Stock can't be negative"),
    note: z
        .string()
        .trim()
        .min(1, "Explain why you're adjusting this — e.g. recount, mis-entered purchase")
        .max(500),
});

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;