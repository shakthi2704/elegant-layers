import { z } from "zod";

export const supplierSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    contact: z
        .string()
        .trim()
        .max(60)
        .optional()
        .or(z.literal(""))
        .transform((v) => (v ? v : undefined)),
    address: z
        .string()
        .trim()
        .max(250)
        .optional()
        .or(z.literal(""))
        .transform((v) => (v ? v : undefined)),
});

export type SupplierInput = z.infer<typeof supplierSchema>;