import { z } from "zod";

export const purchaseItemSchema = z.object({
    ingredientId: z.string().min(1, "Ingredient is required"),
    quantity: z.coerce
        .number({ message: "Quantity is required" })
        .positive("Quantity must be greater than 0"),
    unitCost: z.coerce
        .number({ message: "Unit cost is required" })
        .positive("Unit cost must be greater than 0"),
});

export const purchaseSchema = z.object({
    supplierId: z.string().min(1, "Supplier is required"),
    purchaseDate: z.coerce.date({ message: "Purchase date is required" }),
    items: z.array(purchaseItemSchema).min(1, "Add at least one ingredient"),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;