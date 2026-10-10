import { z } from "zod";

/** Labels live here so the form, the Movements tab and the Waste view agree. */
export const WASTE_REASON_OPTIONS = [
    { value: "EXPIRED", label: "Expired" },
    { value: "NOT_COLLECTED", label: "Not collected / unsold" },
    { value: "DAMAGED", label: "Damaged or spoiled" },
    { value: "OTHER", label: "Other" },
] as const;

export const inventoryWasteSchema = z
    .object({
        itemType: z.enum(["INGREDIENT", "PRODUCT"], {
            message: "Choose whether this is an ingredient or a product",
        }),
        itemId: z.string().min(1, "Select an item"),
        quantity: z.coerce
            .number({ message: "Quantity is required" })
            .positive("Quantity must be greater than 0"),
        reason: z.enum(["EXPIRED", "NOT_COLLECTED", "DAMAGED", "OTHER"], {
            message: "Choose a reason",
        }),
        note: z.string().trim().max(500).optional(),
    })
    .refine((data) => data.reason !== "OTHER" || !!data.note?.length, {
        message: "Describe what happened",
        path: ["note"],
    });

export type InventoryWasteInput = z.infer<typeof inventoryWasteSchema>;