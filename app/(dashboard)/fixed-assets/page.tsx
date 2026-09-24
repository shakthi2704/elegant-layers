import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { calculateDepreciation } from "@/lib/fixed-asset-depreciation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function FixedAssetsPage() {
    await requireRole(["ADMIN"]);

    const assets = await prisma.fixedAsset.findMany({
        orderBy: { purchaseDate: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Fixed Assets</h1>
                    <p className="text-sm text-muted-foreground">
                        Equipment, furniture, and other assets, depreciated straight-line.
                    </p>
                </div>
                <Button nativeButton={false} render={<Link href="/fixed-assets/new" />}>
                    Add Asset
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                            <th className="px-4 py-2.5 font-medium">Name</th>
                            <th className="px-4 py-2.5 font-medium">Category</th>
                            <th className="px-4 py-2.5 font-medium">Purchase Date</th>
                            <th className="px-4 py-2.5 font-medium">Cost</th>
                            <th className="px-4 py-2.5 font-medium">Book Value</th>
                            <th className="px-4 py-2.5 font-medium">Status</th>
                            <th className="px-4 py-2.5 font-medium" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {assets.map((asset) => {
                            const { bookValue } = calculateDepreciation({
                                purchaseCost: asset.purchaseCost.toNumber(),
                                salvageValue: asset.salvageValue.toNumber(),
                                usefulLifeMonths: asset.usefulLifeMonths,
                                purchaseDate: asset.purchaseDate,
                                disposalDate: asset.disposalDate,
                            });

                            return (
                                <tr key={asset.id}>
                                    <td className="px-4 py-2.5 font-medium">{asset.name}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground">
                                        {asset.category || "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-muted-foreground">
                                        {formatDate(asset.purchaseDate)}
                                    </td>
                                    <td className="px-4 py-2.5">Rs. {asset.purchaseCost.toString()}</td>
                                    <td className="px-4 py-2.5">Rs. {bookValue.toFixed(2)}</td>
                                    <td className="px-4 py-2.5">
                                        <Badge variant={asset.status === "ACTIVE" ? "default" : "secondary"}>
                                            {asset.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            nativeButton={false}
                                            render={<Link href={`/fixed-assets/${asset.id}`} />}
                                        >
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {assets.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                                    No fixed assets recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}