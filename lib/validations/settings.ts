import { z } from "zod";

/** The shop details printed on bills and shown around the app. */
export const shopSettingsSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Business name is required")
        .max(80, "Keep the business name under 80 characters"),
    address: z
        .string()
        .trim()
        .max(200, "Keep the address under 200 characters"),
    phone: z
        .string()
        .trim()
        .max(60, "Keep the phone number under 60 characters"),
    billFooter: z
        .string()
        .trim()
        .max(120, "Keep the bill message under 120 characters"),
});

export type ShopSettingsValues = z.infer<typeof shopSettingsSchema>;