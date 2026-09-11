"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { productComponentSchema } from "@/lib/validations/product-component";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    const componentProductIds = formData.getAll("componentProductId");
    const quantities = formData.getAll("quantity");

    return {
        components: componentProductIds.map((componentProductId, index) => ({
            componentProductId,
            quantity: quantities[index],
        })),
    };
}

export async function saveProductComponents(
    productId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = productComponentSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        return { error: "Product not found." };
    }

    if (parsed.data.components.length > 0) {
        const componentProductIds = parsed.data.components.map((c) => c.componentProductId);

        if (componentProductIds.includes(productId)) {
            return { error: "A product cannot be a component of itself." };
        }

        const componentProducts = await prisma.product.findMany({
            where: { id: { in: componentProductIds } },
            include: { components: true },
        });

        if (componentProducts.length !== new Set(componentProductIds).size) {
            return { error: "One or more base products could not be found." };
        }

        const nestedComponent = componentProducts.find((p) => p.components.length > 0);
        if (nestedComponent) {
            return {
                error: `"${nestedComponent.name}" already has its own components attached, so it can't be used as a base for another product. Components can only be one level deep.`,
            };
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.productComponent.deleteMany({ where: { parentProductId: productId } });

        if (parsed.data.components.length > 0) {
            await tx.productComponent.createMany({
                data: parsed.data.components.map((component) => ({
                    parentProductId: productId,
                    componentProductId: component.componentProductId,
                    quantity: component.quantity,
                })),
            });
        }
    });

    revalidatePath(`/products/${productId}/components`);
    revalidatePath("/production/new");
    revalidatePath("/products");
    return { success: true };
}