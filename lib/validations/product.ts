import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(40)
    .regex(/^[A-Za-z0-9-_]+$/, "SKU can only contain letters, numbers, - and _"),
  categoryId: z.string().min(1, "Category is required"),
  sellingPrice: z.coerce.number().positive("Price must be greater than 0"),
  unit: z.enum(["KG", "G", "L", "ML", "PCS"]),
  isFinishedProduct: z.coerce.boolean().default(true),
  minimumStock: z.coerce.number().min(0).default(0),
});

export type ProductInput = z.infer<typeof productSchema>;
