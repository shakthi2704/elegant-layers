"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { fixedAssetSchema, disposeAssetSchema } from "@/lib/validations/fixed-asset";
import type { ActionState } from "@/app/(dashboard)/products/actions";

function parseFormData(formData: FormData) {
    return {
        name: formData.get("name"),
        category: formData.get("category") || undefined,
        purchaseDate: formData.get("purchaseDate"),
        purchaseCost: formData.get("purchaseCost"),
        salvageValue: formData.get("salvageValue") || 0,
        usefulLifeMonths: formData.get("usefulLifeMonths"),
        notes: formData.get("notes") || undefined,
    };
}

export async function createFixedAsset(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await requireRole(["ADMIN"]);

    const parsed = fixedAssetSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const asset = await prisma.fixedAsset.create({
        data: { ...parsed.data, createdById: user.id },
    });

    revalidatePath("/fixed-assets");
    redirect(`/fixed-assets/${asset.id}`);
}

export async function updateFixedAsset(
    assetId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const existing = await prisma.fixedAsset.findUnique({ where: { id: assetId } });
    if (!existing) {
        return { error: "Asset not found." };
    }
    if (existing.status === "DISPOSED") {
        return { error: "This asset has been disposed and can no longer be edited." };
    }

    const parsed = fixedAssetSchema.safeParse(parseFormData(formData));
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await prisma.fixedAsset.update({
        where: { id: assetId },
        data: parsed.data,
    });

    revalidatePath("/fixed-assets");
    revalidatePath(`/fixed-assets/${assetId}`);
    revalidatePath(`/fixed-assets/${assetId}/edit`);
    return { success: true };
}

export async function disposeFixedAsset(
    assetId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const existing = await prisma.fixedAsset.findUnique({ where: { id: assetId } });
    if (!existing) {
        return { error: "Asset not found." };
    }
    if (existing.status === "DISPOSED") {
        return { error: "This asset has already been disposed." };
    }

    const parsed = disposeAssetSchema.safeParse({
        disposalDate: formData.get("disposalDate"),
        notes: formData.get("notes") || undefined,
    });
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    if (parsed.data.disposalDate < existing.purchaseDate) {
        return {
            fieldErrors: { disposalDate: ["Disposal date can't be before the purchase date."] },
        };
    }

    await prisma.fixedAsset.update({
        where: { id: assetId },
        data: {
            status: "DISPOSED",
            disposalDate: parsed.data.disposalDate,
            notes: parsed.data.notes
                ? `${existing.notes ? existing.notes + "\n\n" : ""}Disposed: ${parsed.data.notes}`
                : existing.notes,
        },
    });

    revalidatePath("/fixed-assets");
    revalidatePath(`/fixed-assets/${assetId}`);
    return { success: true };
}