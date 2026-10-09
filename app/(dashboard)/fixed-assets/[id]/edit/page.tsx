import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateFixedAsset } from "@/app/(dashboard)/fixed-assets/actions";
import { FixedAssetForm } from "@/components/fixed-assets/fixed-asset-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
            <Card className="max-w-2xl">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-semibold">
                                Edit Fixed Asset
                            </CardTitle>

                            <CardDescription>
                                {asset.name}
                            </CardDescription>

                            <p className="pt-2 text-sm text-muted-foreground">
                                This fixed asset is recorded in the system for
                                tracking and depreciation purposes.
                            </p>
                        </div>

                        <Badge
                            variant={
                                asset.status === "ACTIVE"
                                    ? "link"
                                    : "secondary"
                            }
                        >
                            {asset.status}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {asset.status === "DISPOSED" ? (
                <p className="max-w-2xl text-sm text-muted-foreground">
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