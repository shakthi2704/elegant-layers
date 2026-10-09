"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { expenseSchema, voidExpenseSchema } from "@/lib/validations/expense";
import type { ActionState } from "@/app/(dashboard)/products/actions";


export async function createExpense(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = expenseSchema.safeParse({
        date: formData.get("date"),
        category: formData.get("category"),
        description: formData.get("description") || undefined,
        amount: formData.get("amount"),
        paymentMethod: formData.get("paymentMethod"),
    });

    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { date, category, description, amount, paymentMethod } = parsed.data;

    await prisma.expense.create({
        data: {
            // Stored as UTC midnight of the chosen day, like Cake Order pickup
            // dates, so Colombo-day grouping in Reports puts it on that day.
            date: new Date(`${date}T00:00:00Z`),
            category,
            description,
            amount,
            paymentMethod,
            recordedById: user.id,
        },
    });

    revalidatePath("/expenses");
    redirect("/expenses");
}


export async function voidExpense(
    expenseId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = voidExpenseSchema.safeParse({
        reason: formData.get("reason"),
    });
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.expense.findUnique({
        where: { id: expenseId },
    });
    if (!existing) {
        return { error: "Expense not found." };
    }
    if (existing.status === "VOID") {
        return { error: "This expense has already been voided." };
    }

    // The status check in the where clause stops a double-click or a second
    // owner from voiding the same expense twice.
    const result = await prisma.expense.updateMany({
        where: { id: expenseId, status: "ACTIVE" },
        data: {
            status: "VOID",
            voidReason: parsed.data.reason,
            voidedAt: new Date(),
            voidedById: user.id,
        },
    });
    if (result.count === 0) {
        return { error: "This expense has already been voided." };
    }

    revalidatePath("/expenses");
    revalidatePath(`/expenses/${expenseId}`);
    redirect("/expenses");
}