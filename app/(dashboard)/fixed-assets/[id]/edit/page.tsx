import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateFixedAsset } from "@/app/(dashboard)/fixed-assets/actions";
import { FixedAssetForm } from "@/components/fixed-assets/fixed-asset-form";

export default async function EditFixedAssetPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const asset = await prisma.fixedAsset.findUnique({ where: { id } });
    if (!asset) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Edit Fixed Asset</h1>
                <p className="text-sm text-muted-foreground">{asset.name}</p>
            </div>

            {asset.status === "DISPOSED" ? (
                <p className="text-sm text-muted-foreground">
                    This asset has been disposed and can no longer be edited.
                </p>
            ) : (
                <FixedAssetForm
                    action={updateFixedAsset.bind(null, asset.id)}
                    defaultValues={{
                        name: asset.name,
                        category: asset.category,
                        purchaseDate: asset.purchaseDate.toISOString().slice(0, 10),
                        purchaseCost: asset.purchaseCost.toString(),
                        salvageValue: asset.salvageValue.toString(),
                        usefulLifeMonths: asset.usefulLifeMonths,
                        notes: asset.notes,
                    }}
                    submitLabel="Save Changes"
                />
            )}
        </div>
    );
}