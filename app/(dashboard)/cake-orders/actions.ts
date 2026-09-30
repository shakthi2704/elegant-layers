"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { cakeOrderSchema, cancelCakeOrderSchema } from "@/lib/validations/cake-order";
import type { ActionState } from "@/app/(dashboard)/products/actions";

const FORWARD_TRANSITIONS: Record<string, "IN_PROGRESS" | "READY" | "COLLECTED"> = {
    PENDING: "IN_PROGRESS",
    IN_PROGRESS: "READY",
    READY: "COLLECTED",
};

function parseFormData(formData: FormData) {
    const productId = formData.get("productId");
    const paymentMethod = formData.get("paymentMethod");

    return {
        customerName: formData.get("customerName"),
        customerPhone: formData.get("customerPhone"),
        productId: productId && productId !== "none" ? productId : undefined,
        cakeName: formData.get("cakeName"),
        shape: formData.get("shape") || undefined,
        weight: formData.get("weight") || undefined,
        message: formData.get("message") || undefined,
        imageUrl: formData.get("imageUrl") || undefined,
        pickupDate: formData.get("pickupDate"),
        pickupTime: formData.get("pickupTime"),
        price: formData.get("price") || undefined,
        advancePaid: formData.get("advancePaid") || undefined,
        paymentMethod: paymentMethod && paymentMethod !== "none" ? paymentMethod : undefined,
        notes: formData.get("notes") || undefined,
    };
}

export async function createCakeOrder(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN", "CASHIER"]);

    const parsed = cakeOrderSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { customerName, customerPhone, ...orderData } = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.upsert({
            where: { phone: customerPhone },
            update: { name: customerName },
            create: { name: customerName, phone: customerPhone },
        });

        return tx.cakeOrder.create({
            data: {
                ...orderData,
                customerId: customer.id,
                createdById: user.id,
            },
        });
    });

    revalidatePath("/cake-orders");
    redirect(`/cake-orders/${order.id}`);
}

export async function updateCakeOrder(
    orderId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN", "CASHIER"]);

    const existing = await prisma.cakeOrder.findUnique({ where: { id: orderId } });
    if (!existing) {
        return { error: "Order not found." };
    }
    if (existing.status === "COLLECTED" || existing.status === "CANCELLED") {
        return {
            error: `This order is ${existing.status.toLowerCase()} and can't be edited.`,
        };
    }

    const parsed = cakeOrderSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { customerName, customerPhone, ...orderData } = parsed.data;

    await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.upsert({
            where: { phone: customerPhone },
            update: { name: customerName },
            create: { name: customerName, phone: customerPhone },
        });

        // Prisma treats `undefined` as "leave unchanged", so every optional
        // field is mapped to null explicitly; otherwise clearing a field in
        // the form (e.g. removing the photo) would silently do nothing.
        await tx.cakeOrder.update({
            where: { id: orderId },
            data: {
                customerId: customer.id,
                productId: orderData.productId ?? null,
                cakeName: orderData.cakeName,
                shape: orderData.shape ?? null,
                weight: orderData.weight ?? null,
                message: orderData.message ?? null,
                imageUrl: orderData.imageUrl ?? null,
                pickupDate: orderData.pickupDate,
                pickupTime: orderData.pickupTime,
                price: orderData.price ?? null,
                advancePaid: orderData.advancePaid ?? null,
                paymentMethod: orderData.paymentMethod ?? null,
                notes: orderData.notes ?? null,
            },
        });
    });

    revalidatePath("/cake-orders");
    revalidatePath(`/cake-orders/${orderId}`);
    redirect(`/cake-orders/${orderId}`);
}

export async function advanceCakeOrderStatus(
    orderId: string,
    _prevState: ActionState,
    _formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN", "CASHIER"]);

    const existing = await prisma.cakeOrder.findUnique({ where: { id: orderId } });
    if (!existing) {
        return { error: "Order not found." };
    }

    const nextStatus = FORWARD_TRANSITIONS[existing.status];
    if (!nextStatus) {
        return { error: "This order can't be moved forward from its current status." };
    }

    await prisma.cakeOrder.update({
        where: { id: orderId },
        data: { status: nextStatus },
    });

    revalidatePath("/cake-orders");
    revalidatePath(`/cake-orders/${orderId}`);
    return { success: true };
}

export async function cancelCakeOrder(
    orderId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const existing = await prisma.cakeOrder.findUnique({ where: { id: orderId } });
    if (!existing) {
        return { error: "Order not found." };
    }
    if (existing.status === "COLLECTED" || existing.status === "CANCELLED") {
        return {
            error: `This order is already ${existing.status.toLowerCase()} and can't be cancelled.`,
        };
    }

    const parsed = cancelCakeOrderSchema.safeParse({ reason: formData.get("reason") });
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await prisma.cakeOrder.update({
        where: { id: orderId },
        data: {
            status: "CANCELLED",
            notes: `${existing.notes ? existing.notes + "\n\n" : ""}Cancelled: ${parsed.data.reason}`,
        },
    });

    revalidatePath("/cake-orders");
    revalidatePath(`/cake-orders/${orderId}`);
    return { success: true };
}