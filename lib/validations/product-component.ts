import { z } from "zod";

export const productComponentItemSchema = z.object({
    componentProductId: z.string().min(1, "Base product is required"),
    quantity: z.coerce
        .number({ message: "Quantity is required" })
        .positive("Quantity must be greater than 0"),
});

export const productComponentSchema = z
    .object({
        components: z.array(productComponentItemSchema),
    })
    .refine(
        (data) => {
            const ids = data.components.map((c) => c.componentProductId);
            return new Set(ids).size === ids.length;
        },
        { message: "Each base product can only be attached once", path: ["components"] }
    );

export type ProductComponentInput = z.infer<typeof productComponentSchema>;