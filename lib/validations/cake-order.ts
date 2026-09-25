import { z } from "zod";

export const cakeOrderSchema = z
    .object({
        customerName: z.string().trim().min(1, "Customer name is required").max(150),
        customerPhone: z
            .string()
            .trim()
            .min(7, "Enter a valid phone number")
            .max(20)
            .regex(/^[0-9+\-\s()]+$/, "Phone number can only contain digits and + - ( ) spaces"),
        productId: z.string().optional(),
        cakeName: z.string().trim().min(1, "Cake name is required").max(150),
        shape: z.string().trim().max(100).optional(),
        weight: z.string().trim().max(50).optional(),
        message: z.string().trim().max(200).optional(),
        imageUrl: z.string().trim().url("Must be a valid image URL").optional(),
        pickupDate: z.coerce.date({ message: "Pickup date is required" }),
        pickupTime: z
            .string()
            .trim()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Pickup time must be in HH:MM format"),
        price: z.coerce.number().min(0, "Price can't be negative").optional(),
        advancePaid: z.coerce.number().min(0, "Advance can't be negative").optional(),
        paymentMethod: z.enum(["CASH", "BANK_DEPOSIT"]).optional(),
        notes: z.string().trim().max(1000).optional(),
    })
    .refine((data) => !data.advancePaid || data.paymentMethod, {
        message: "Payment method is required when an advance is recorded",
        path: ["paymentMethod"],
    })
    .refine((data) => !data.price || !data.advancePaid || data.advancePaid <= data.price, {
        message: "Advance paid can't exceed the price",
        path: ["advancePaid"],
    });

export type CakeOrderInput = z.infer<typeof cakeOrderSchema>;

export const cancelCakeOrderSchema = z.object({
    reason: z.string().trim().min(1, "A reason is required").max(500),
});