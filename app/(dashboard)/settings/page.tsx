import { requireRole } from "@/lib/require-role";
import { getShopSettings } from "@/lib/settings";
import { saveShopSettings } from "@/app/(dashboard)/settings/actions";
import { ShopSettingsForm } from "@/components/settings/shop-settings-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
    await requireRole(["ADMIN"]);

    const settings = await getShopSettings();

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">
                        Shop Settings
                    </CardTitle>

                    <p className="pt-1 text-sm text-muted-foreground">
                        These details are printed on your bills and shown in the
                        app. Changes apply to bills printed from now on; bills
                        already printed are not affected.
                    </p>
                </CardHeader>
            </Card>

            <ShopSettingsForm action={saveShopSettings} defaults={settings} />
        </div>
    );
}