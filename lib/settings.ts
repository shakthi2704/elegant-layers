import "server-only";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { ShopSettingsValues } from "@/lib/validations/settings";

/**
 * The shop details live in the existing key/value Settings table, so adding
 * or changing them never needs a migration.
 */
export const SETTING_KEYS = {
    name: "shop.name",
    address: "shop.address",
    phone: "shop.phone",
    billFooter: "shop.billFooter",
} as const;

export const DEFAULT_SHOP_NAME = "Elegant Layers";

/** Read once per request, however many components ask for it. */
export const getShopSettings = cache(async (): Promise<ShopSettingsValues> => {
    const rows = await prisma.settings.findMany({
        where: { key: { in: Object.values(SETTING_KEYS) } },
    });
    const byKey = new Map(rows.map((row) => [row.key, row.value]));

    return {
        name: byKey.get(SETTING_KEYS.name)?.trim() || DEFAULT_SHOP_NAME,
        address: byKey.get(SETTING_KEYS.address) ?? "",
        phone: byKey.get(SETTING_KEYS.phone) ?? "",
        billFooter: byKey.get(SETTING_KEYS.billFooter) ?? "",
    };
});