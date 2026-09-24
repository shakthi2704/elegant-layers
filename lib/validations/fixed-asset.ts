import { z } from "zod";

export const fixedAssetSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(200),
        category: z.string().trim().max(100).optional(),
        purchaseDate: z.coerce.date({ message: "Purchase date is required" }),
        purchaseCost: z.coerce
            .number({ message: "Purchase cost is required" })
            .positive("Purchase cost must be greater than 0"),
        salvageValue: z.coerce
            .number()
            .min(0, "Salvage value can't be negative")
            .default(0),
        usefulLifeMonths: z.coerce
            .number({ message: "Useful life is required" })
            .int("Useful life must be a whole number of months")
            .positive("Useful life must be at least 1 month"),
        notes: z.string().trim().max(1000).optional(),
    })
    .refine((data) => data.salvageValue < data.purchaseCost, {
        message: "Salvage value must be less than purchase cost",
        path: ["salvageValue"],
    });

export const disposeAssetSchema = z.object({
    disposalDate: z.coerce.date({ message: "Disposal date is required" }),
    notes: z.string().trim().max(1000).optional(),
});

export type FixedAssetInput = z.infer<typeof fixedAssetSchema>;