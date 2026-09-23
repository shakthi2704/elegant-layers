import { z } from "zod";

export const purchaseItemSchema = z.object({
    itemType: z.enum(["INGREDIENT", "PRODUCT"], {
        message: "Choose whether this line is an ingredient or a product",
    }),
    itemId: z.string().min(1, "Select an item"),
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
    items: z.array(purchaseItemSchema).min(1, "Add at least one item"),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;