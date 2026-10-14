"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { SETTING_KEYS } from "@/lib/settings";
import { shopSettingsSchema } from "@/lib/validations/settings";
import type { ActionState } from "@/app/(dashboard)/products/actions";

export async function saveShopSettings(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = shopSettingsSchema.safeParse({
        name: formData.get("name") ?? "",
        address: formData.get("address") ?? "",
        phone: formData.get("phone") ?? "",
        billFooter: formData.get("billFooter") ?? "",
    });

    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const values: Record<string, string> = {
        [SETTING_KEYS.name]: parsed.data.name,
        [SETTING_KEYS.address]: parsed.data.address,
        [SETTING_KEYS.phone]: parsed.data.phone,
        [SETTING_KEYS.billFooter]: parsed.data.billFooter,
    };

    // All four save together or not at all.
    await prisma.$transaction(
        Object.entries(values).map(([key, value]) =>
            prisma.settings.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            })
        )
    );

    // The name shows in the sidebar, so refresh every page.
    revalidatePath("/", "layout");
    return { success: true };
}