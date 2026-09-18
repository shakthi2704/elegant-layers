"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { productSchema } from "@/lib/validations/product";

export type ActionState = {
    error?: string;
    fieldErrors?: Record<string, string[]>;
    success?: boolean;
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

export async function deleteProduct(productId: string): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { usedAsComponentIn: { include: { parentProduct: true } } },
    });
    if (!product) {
        return { error: "Product not found." };
    }

    if (product.usedAsComponentIn.length > 0) {
        const usedInNames = product.usedAsComponentIn
            .map((pc) => pc.parentProduct.name)
            .join(", ");
        return {
            error: `"${product.name}" is used as a base for ${usedInNames}. Remove it from ${product.usedAsComponentIn.length === 1 ? "that product's" : "those products'"} Base Setup first before deleting.`,
        };
    }

    const [txnCount, cakeOrderCount] = await Promise.all([
        prisma.inventoryTransaction.count({ where: { productId } }),
        prisma.cakeOrder.count({ where: { productId } }),
    ]);

    if (txnCount > 0) {
        return {
            error: `"${product.name}" has stock activity recorded (purchases, production, sales, or adjustments) and can't be deleted. Deactivate it instead to hide it from new orders.`,
        };
    }

    if (cakeOrderCount > 0) {
        return {
            error: `"${product.name}" is referenced in ${cakeOrderCount} cake order${cakeOrderCount === 1 ? "" : "s"} and can't be deleted.`,
        };
    }

    await prisma.product.delete({ where: { id: productId } });

    revalidatePath("/products");
    return { success: true };
}