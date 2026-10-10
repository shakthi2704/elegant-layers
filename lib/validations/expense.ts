import { z } from "zod";

import { colomboToday } from "@/lib/format";

/**
 * Fixed list, kept in code rather than the database so Reports can group
 * reliably ("Electricity" vs "electricity" would otherwise be two rows).
 * To add a category later, add it here — no migration needed.
 */
export const EXPENSE_CATEGORIES = [
    "Rent",
    "Salaries",
    "Electricity",
    "Water",
    "Gas",
    "Transport",
    "Packaging",
    "Repairs",
    "Marketing",
    "Supplies",
    "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_PAYMENT_METHODS = ["CASH", "BANK_DEPOSIT"] as const;

export const expenseSchema = z
    .object({
        date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
        category: z.enum(EXPENSE_CATEGORIES, {
            message: "Choose a category",
        }),
        description: z.string().trim().max(500).optional(),
        amount: z.coerce
            .number({ message: "Amount is required" })
            .positive("Amount must be greater than 0"),
        paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS, {
            message: "Choose how it was paid",
        }),
    })
    .refine((data) => data.date <= colomboToday(), {
        message: "Date can't be in the future",
        path: ["date"],
    })
    .refine(
        (data) => data.category !== "Other" || !!data.description?.length,
        {
            message: "Describe what this expense was for",
            path: ["description"],
        }
    );

export const voidExpenseSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(1, "Give a reason for voiding this expense")
        .max(500),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;