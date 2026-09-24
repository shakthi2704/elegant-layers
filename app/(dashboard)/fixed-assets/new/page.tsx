import { requireRole } from "@/lib/require-role";
import { createFixedAsset } from "@/app/(dashboard)/fixed-assets/actions";
import { FixedAssetForm } from "@/components/fixed-assets/fixed-asset-form";

export default async function NewFixedAssetPage() {
    await requireRole(["ADMIN"]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Add Fixed Asset</h1>
                <p className="text-sm text-muted-foreground">
                    Record a piece of equipment, furniture, or other asset to depreciate.
                </p>
            </div>

            <FixedAssetForm action={createFixedAsset} submitLabel="Add Asset" />
        </div>
    );
}