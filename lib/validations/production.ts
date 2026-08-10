import { z } from "zod";

export const productionItemSchema = z.object({
    productId: z.string().min(1, "Product is required"),
    quantityProduced: z.coerce
        .number({ message: "Quantity is required" })
        .positive("Quantity must be greater than 0"),
});

export const productionSchema = z.object({
    productionDate: z.coerce.date({ message: "Production date is required" }),
    notes: z
        .string()
        .trim()
        .max(500)
        .optional()
        .or(z.literal(""))
        .transform((v) => (v ? v : undefined)),
    items: z.array(productionItemSchema).min(1, "Add at least one product"),
});

export type ProductionInput = z.infer<typeof productionSchema>;
export type ProductionItemInput = z.infer<typeof productionItemSchema>;