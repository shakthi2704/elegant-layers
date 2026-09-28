import Link from "next/link";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { calculateDepreciation } from "@/lib/fixed-asset-depreciation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


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
            <div className="overflow-hidden rounded-md">
                <Table className="w-full text-sm  border border-border ">
                    <TableHeader className="bg-muted ">
                        <TableRow className="">
                            <TableHead className="px-4 py-2.5 font-medium">
                                Name
                            </TableHead>

                            <TableHead className="px-4 py-2.5 font-medium">
                                Category
                            </TableHead>

                            <TableHead className="px-4 py-2.5 font-medium">
                                Purchase Date
                            </TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Cost
                            </TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Book Value
                            </TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">
                                Status
                            </TableHead>

                            <TableHead className="px-4 py-2.5 text-right font-medium">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border bg-muted/20">
                        {assets.map((asset) => {
                            const { bookValue } = calculateDepreciation({
                                purchaseCost: asset.purchaseCost.toNumber(),
                                salvageValue: asset.salvageValue.toNumber(),
                                usefulLifeMonths: asset.usefulLifeMonths,
                                purchaseDate: asset.purchaseDate,
                                disposalDate: asset.disposalDate,
                            });

                            return (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-medium">
                                        {asset.name}
                                    </TableCell>

                                    <TableCell className="text-muted-foreground">
                                        {asset.category || "—"}
                                    </TableCell>

                                    <TableCell className="text-muted-foreground">
                                        {formatDate(asset.purchaseDate)}
                                    </TableCell>

                                    <TableCell>
                                        Rs. {asset.purchaseCost.toString()}
                                    </TableCell>

                                    <TableCell>
                                        Rs. {bookValue.toFixed(2)}
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            variant={
                                                asset.status === "ACTIVE"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {asset.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            nativeButton={false}
                                            render={
                                                <Link
                                                    href={`/fixed-assets/${asset.id}`}
                                                />
                                            }
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {assets.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No fixed assets recorded yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                </Table>
            </div>
        </div>
    );
}