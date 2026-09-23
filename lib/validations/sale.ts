import { z } from "zod";

export const saleItemSchema = z.object({
    productId: z.string().min(1, "Select a product"),
    quantity: z.coerce
        .number({ message: "Quantity is required" })
        .positive("Quantity must be greater than 0"),
    unitPrice: z.coerce.number({ message: "Price is required" }).min(0),
    discount: z.coerce.number().min(0).default(0),
});

const saleBaseSchema = z.object({
    type: z.enum(["DINE_IN", "TAKEAWAY"], {
        message: "Choose Dine-in or Takeaway",
    }),
    discount: z.coerce.number().min(0).default(0),
    items: z.array(saleItemSchema).min(1, "Add at least one item to the bill"),
});

export const holdSaleSchema = saleBaseSchema.extend({
    holdLabel: z.string().trim().max(100).optional(),
});
export const completeSaleSchema = saleBaseSchema.extend({
    cashReceived: z.coerce
        .number({ message: "Cash received is required" })
        .min(0),
});

export const voidSaleSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(1, "Explain why this sale is being voided")
        .max(500),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type HoldSaleInput = z.infer<typeof holdSaleSchema>;
export type CompleteSaleInput = z.infer<typeof completeSaleSchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;