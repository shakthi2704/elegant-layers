import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { calculateDepreciation } from "@/lib/fixed-asset-depreciation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisposeAssetButton } from "@/components/fixed-assets/dispose-asset-button";

export default async function FixedAssetDetailPage({
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

    const depreciation = calculateDepreciation({
        purchaseCost: asset.purchaseCost.toNumber(),
        salvageValue: asset.salvageValue.toNumber(),
        usefulLifeMonths: asset.usefulLifeMonths,
        purchaseDate: asset.purchaseDate,
        disposalDate: asset.disposalDate,
    });

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{asset.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {asset.category || "Uncategorized"} · Purchased {formatDate(asset.purchaseDate)}
                    </p>
                </div>
                <Badge variant={asset.status === "ACTIVE" ? "default" : "secondary"}>
                    {asset.status}
                </Badge>
            </div>

            {asset.status === "DISPOSED" && asset.disposalDate && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="font-medium">Disposed</p>
                    <p className="text-sm text-muted-foreground">
                        On {formatDate(asset.disposalDate)}
                    </p>
                </div>
            )}

            <div className="rounded-lg border border-border p-4">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">Depreciation (straight-line)</h2>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Purchase cost</dt>
                    <dd className="text-right">Rs. {asset.purchaseCost.toString()}</dd>

                    <dt className="text-muted-foreground">Salvage value</dt>
                    <dd className="text-right">Rs. {asset.salvageValue.toString()}</dd>

                    <dt className="text-muted-foreground">Useful life</dt>
                    <dd className="text-right">{asset.usefulLifeMonths} months</dd>

                    <dt className="text-muted-foreground">Monthly depreciation</dt>
                    <dd className="text-right">Rs. {depreciation.monthlyDepreciation.toFixed(2)}</dd>

                    <dt className="text-muted-foreground">Months elapsed</dt>
                    <dd className="text-right">
                        {depreciation.monthsElapsed} / {asset.usefulLifeMonths}
                        {depreciation.isFullyDepreciated && " (fully depreciated)"}
                    </dd>

                    <dt className="text-muted-foreground">Accumulated depreciation</dt>
                    <dd className="text-right">Rs. {depreciation.accumulatedDepreciation.toFixed(2)}</dd>

                    <dt className="font-medium">Current book value</dt>
                    <dd className="text-right text-base font-semibold">
                        Rs. {depreciation.bookValue.toFixed(2)}
                    </dd>
                </dl>
            </div>

            {asset.notes && (
                <div className="rounded-lg border border-border p-4">
                    <h2 className="mb-1 text-sm font-medium text-muted-foreground">Notes</h2>
                    <p className="whitespace-pre-wrap text-sm">{asset.notes}</p>
                </div>
            )}

            {asset.status === "ACTIVE" && (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={`/fixed-assets/${asset.id}/edit`} />}
                    >
                        Edit
                    </Button>
                    <DisposeAssetButton assetId={asset.id} assetName={asset.name} />
                </div>
            )}
        </div>
    );
}