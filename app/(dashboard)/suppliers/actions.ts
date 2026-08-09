"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { supplierSchema } from "@/lib/validations/supplier";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    return {
        name: formData.get("name"),
        contact: formData.get("contact"),
        address: formData.get("address"),
    };
}

export async function createSupplier(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = supplierSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await prisma.supplier.create({ data: parsed.data });

    revalidatePath("/suppliers");
    redirect("/suppliers");
}

export async function updateSupplier(
    supplierId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = supplierSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await prisma.supplier.update({
        where: { id: supplierId },
        data: parsed.data,
    });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${supplierId}/edit`);
    return {};
}