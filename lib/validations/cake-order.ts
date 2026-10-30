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
        // The price before any discount. The action saves what the customer
        // pays (price - discount) so income and balances stay correct.
        price: z.coerce.number().min(0, "Price can't be negative").optional(),
        discount: z.coerce.number().min(0, "Discount can't be negative").optional(),
        isComplimentary: z.boolean().optional(),
        complimentaryReason: z.string().trim().max(200).optional(),
        advancePaid: z.coerce.number().min(0, "Advance can't be negative").optional(),
        paymentMethod: z.enum(["CASH", "BANK_DEPOSIT"]).optional(),
        notes: z.string().trim().max(1000).optional(),
    })
    .refine((data) => !data.advancePaid || data.paymentMethod, {
        message: "Payment method is required when an advance is recorded",
        path: ["paymentMethod"],
    })
    .refine((data) => data.isComplimentary || !data.discount || data.price, {
        message: "Enter the price before giving a discount",
        path: ["discount"],
    })
    .refine(
        (data) =>
            data.isComplimentary ||
            !data.price ||
            !data.discount ||
            data.discount <= data.price,
        {
            message: "The discount can't be more than the price",
            path: ["discount"],
        }
    )
    .refine((data) => !data.isComplimentary || (data.price ?? 0) > 0, {
        message: "Enter the price: it is recorded as the value given away",
        path: ["price"],
    })
    .refine(
        (data) =>
            !data.isComplimentary || (data.complimentaryReason?.length ?? 0) >= 3,
        {
            message: "Please give a reason",
            path: ["complimentaryReason"],
        }
    )
    .refine((data) => !data.isComplimentary || !data.advancePaid, {
        message: "A complimentary order has nothing to pay, so there is no advance",
        path: ["advancePaid"],
    })
    .refine(
        (data) =>
            data.isComplimentary ||
            !data.price ||
            !data.advancePaid ||
            data.advancePaid <= data.price - (data.discount ?? 0),
        {
            message: "Advance paid can't exceed the amount to pay",
            path: ["advancePaid"],
        }
    );

export type CakeOrderInput = z.infer<typeof cakeOrderSchema>;

export const cancelCakeOrderSchema = z.object({
    reason: z.string().trim().min(1, "A reason is required").max(500),
    // Required by the action only when the order has an advance.
    advanceOutcome: z.enum(["KEPT", "REFUNDED"]).optional(),
    // The cake was already made and is being thrown away.
    discardCake: z.boolean().optional(),
    discardReason: z
        .enum(["EXPIRED", "NOT_COLLECTED", "DAMAGED", "OTHER"])
        .optional(),
});
export const advanceOutcomeSchema = z.object({
    advanceOutcome: z.enum(["KEPT", "REFUNDED"], {
        message: "Choose whether the advance was kept or refunded.",
    }),
});

export const startCakeOrderSchema = z.object({
    // A one-off list of what this custom cake uses. It can be empty.
    items: z
        .array(
            z.object({
                ingredientId: z.string().min(1, "Choose an ingredient"),
                quantity: z.coerce
                    .number({ message: "Enter a quantity" })
                    .min(0.001, "Quantity must be at least 0.001")
                    .max(100000, "That quantity looks too large, please check it")
                    .transform((n) => Math.round(n * 1000) / 1000),
            })
        )
        .max(50, "Too many ingredients on one order"),
});