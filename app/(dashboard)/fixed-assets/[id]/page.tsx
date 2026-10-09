import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { calculateDepreciation } from "@/lib/fixed-asset-depreciation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisposeAssetButton } from "@/components/fixed-assets/dispose-asset-button";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";


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
        <div className="space-y-6">

            <Card className="max-w-2xl">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-semibold">
                                {asset.name}
                            </CardTitle>

                            <CardDescription>
                                {asset.category || "Uncategorized"} · Purchased{" "}
                                {formatDate(asset.purchaseDate)}
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

            <Card className="max-w-2xl">
                <CardContent className="space-y-6">
                    {/* Disposed */}
                    {asset.status === "DISPOSED" && asset.disposalDate && (
                        <div className="rounded-md border border-border bg-muted/30 p-4">
                            <p className="font-medium">Disposed</p>
                            <p className="text-sm text-muted-foreground">
                                On {formatDate(asset.disposalDate)}
                            </p>
                        </div>
                    )}

                    {/* Depreciation */}
                    <div className="rounded-md  p-4">
                        <h2 className="mb-3 text-base font-medium text-muted-foreground">
                            Depreciation (straight-line)
                        </h2>

                        <dl className="grid grid-cols-2 gap-y-3 text-sm">
                            <dt className="text-muted-foreground">
                                Purchase cost
                            </dt>
                            <dd className="text-right">
                                Rs.{" "}
                                {Number(asset.purchaseCost).toLocaleString("en-LK")}
                            </dd>

                            <dt className="text-muted-foreground">
                                Salvage value
                            </dt>
                            <dd className="text-right">
                                Rs.{" "}
                                {Number(asset.salvageValue).toLocaleString("en-LK")}
                            </dd>

                            <dt className="text-muted-foreground">
                                Useful life
                            </dt>
                            <dd className="text-right">
                                {asset.usefulLifeMonths} months
                            </dd>

                            <dt className="text-muted-foreground">
                                Monthly depreciation
                            </dt>
                            <dd className="text-right">
                                Rs.{" "}
                                {depreciation.monthlyDepreciation.toLocaleString(
                                    "en-LK",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </dd>

                            <dt className="text-muted-foreground">
                                Months elapsed
                            </dt>
                            <dd className="text-right">
                                {depreciation.monthsElapsed} /{" "}
                                {asset.usefulLifeMonths}
                                {depreciation.isFullyDepreciated &&
                                    " (fully depreciated)"}
                            </dd>

                            <dt className="text-muted-foreground">
                                Accumulated depreciation
                            </dt>
                            <dd className="text-right">
                                Rs.{" "}
                                {depreciation.accumulatedDepreciation.toLocaleString(
                                    "en-LK",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </dd>

                            <dt className="font-medium">
                                Current book value
                            </dt>
                            <dd className="text-right text-base font-semibold">
                                Rs.{" "}
                                {depreciation.bookValue.toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </dd>
                        </dl>
                    </div>

                    {/* Notes */}
                    {asset.notes && (
                        <div className="rounded-md border border-border p-4">
                            <h2 className="mb-1 text-sm font-medium text-muted-foreground">
                                Notes
                            </h2>

                            <p className="whitespace-pre-wrap text-sm">
                                {asset.notes}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    {asset.status === "ACTIVE" && (
                        <div className="flex items-center justify-end gap-3 border-t pt-6">
                            <Button
                                nativeButton={false}
                                variant="outline"
                                render={
                                    <Link href="/fixed-assets" />
                                }
                            >
                                Cancel
                            </Button>

                            <Button
                                nativeButton={false}
                                render={
                                    <Link
                                        href={`/fixed-assets/${asset.id}/edit`}
                                    />
                                }
                            >
                                Edit
                            </Button>

                            <DisposeAssetButton
                                assetId={asset.id}
                                assetName={asset.name}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

    );
}