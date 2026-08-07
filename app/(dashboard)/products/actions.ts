"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { productSchema } from "@/lib/validations/product";

export type ActionState = {
    error?: string;
    fieldErrors?: Record<string, string[]>;
};

function parseFormData(formData: FormData) {
    return {
        name: formData.get("name"),
        sku: formData.get("sku"),
        categoryId: formData.get("categoryId"),
        sellingPrice: formData.get("sellingPrice"),
        unit: formData.get("unit"),
        isFinishedProduct: formData.get("isFinishedProduct") === "on",
        minimumStock: formData.get("minimumStock") || 0,
    };
}

export async function createProduct(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = productSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.product.findUnique({
        where: { sku: parsed.data.sku },
    });
    if (existing) {
        return { fieldErrors: { sku: ["A product with this SKU already exists."] } };
    }

    const product = await prisma.product.create({ data: parsed.data });

    revalidatePath("/products");
    redirect(`/products/${product.id}/edit`);
}

export async function updateProduct(
    productId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = productSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.product.findFirst({
        where: { sku: parsed.data.sku, NOT: { id: productId } },
    });
    if (existing) {
        return { fieldErrors: { sku: ["A product with this SKU already exists."] } };
    }

    await prisma.product.update({
        where: { id: productId },
        data: parsed.data,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}/edit`);
    return {};
}

export async function toggleProductStatus(productId: string) {
    await requireRole(["ADMIN"]);

    const product = await prisma.product.findUniqueOrThrow({
        where: { id: productId },
        select: { status: true },
    });

    await prisma.product.update({
        where: { id: productId },
        data: { status: product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });

    revalidatePath("/products");
}
