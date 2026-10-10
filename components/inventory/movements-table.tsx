import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDateTime, colomboDayStart, colomboDayEnd } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { WASTE_REASON_OPTIONS } from "@/lib/validations/inventory-waste";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const LIMIT = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type MovementFilters = {
    type?: string;
    from?: string;
    to?: string;
    q?: string;
};


function buildWhere({
    type,
    from,
    to,
    q,
}: MovementFilters): Prisma.InventoryTransactionWhereInput {
    const where: Prisma.InventoryTransactionWhereInput = {};

    switch (type) {
        case "PURCHASE":
        case "PRODUCTION_IN":
        case "PRODUCTION_OUT":
        case "WASTE":
        case "ADJUSTMENT":
            where.type = type;
            break;
        case "SALE":
            where.type = "SALE";
            where.referenceType = "SALE";
            break;
        case "SALE_VOID":
            where.type = "SALE";
            where.referenceType = "SALE_VOID";
            break;
    }

    const validFrom = from && DATE_RE.test(from) ? from : undefined;
    const validTo = to && DATE_RE.test(to) ? to : undefined;
    if (validFrom || validTo) {
        where.createdAt = {
            gte: validFrom ? colomboDayStart(validFrom) : undefined,
            lte: validTo ? colomboDayEnd(validTo) : undefined,
        };
    }

    const search = q?.trim();
    if (search) {
        where.OR = [
            { ingredient: { name: { contains: search, mode: "insensitive" } } },
            { product: { name: { contains: search, mode: "insensitive" } } },
        ];
    }

    return where;
}

function typeLabel(type: string, referenceType: string | null) {
    if (type === "SALE" && referenceType === "SALE_VOID") return "Sale void";
    switch (type) {
        case "PURCHASE":
            return "Purchase";
        case "PRODUCTION_IN":
            return "Production (made)";
        case "PRODUCTION_OUT":
            return "Production (used)";
        case "SALE":
            return "Sale";
        case "WASTE":
            return "Waste";
        case "ADJUSTMENT":
            return "Adjustment";
        default:
            return type;
    }
}

/** Where the movement came from: a label plus the page that shows the source. */
function getSource(
    txn: {
        id: string;
        type: string;
        referenceType: string | null;
        referenceId: string | null;
    }
) {
    // Waste is entered by hand but has no detail page, so it gets no link.
    if (txn.type === "WASTE") return null;
    if (txn.referenceType === "PURCHASE" && txn.referenceId) {
        return { label: "Purchase", href: `/purchases/${txn.referenceId}` };
    }
    if (txn.referenceType === "PRODUCTION" && txn.referenceId) {
        return { label: "Production", href: `/production/${txn.referenceId}` };
    }
    if (
        (txn.referenceType === "SALE" || txn.referenceType === "SALE_VOID") &&
        txn.referenceId
    ) {
        return { label: "Sale", href: `/pos/${txn.referenceId}` };
    }
    if (txn.referenceType === "MANUAL") {
        return { label: "Adjustment", href: `/inventory/${txn.id}` };
    }
    return null;
}


export async function MovementsTable({
    filters,
}: {
    filters: MovementFilters;
}) {
    const movements = await prisma.inventoryTransaction.findMany({
        where: buildWhere(filters),
        include: { ingredient: true, product: true, createdBy: true },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
    });
    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
                {movements.length === LIMIT
                    ? `Showing the latest ${LIMIT} matching movements. Narrow the filters to see older ones.`
                    : `${movements.length} movement${movements.length === 1 ? "" : "s"} found.`}
            </p>

            <div className="overflow-hidden rounded-md">
                <Table className="w-full border border-border text-sm">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="px-4 py-2.5 font-medium">Date</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Item</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Type</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Change</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Balance After</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Source</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">By</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border bg-muted/20">
                        {movements.map((txn) => {
                            const item = txn.ingredient ?? txn.product;
                            const quantity = txn.quantity.toNumber();
                            const source = getSource(txn);

                            return (
                                <TableRow key={txn.id}>
                                    <TableCell className="px-4 py-2.5 text-muted-foreground">
                                        {formatDateTime(txn.createdAt)}
                                    </TableCell>

                                    <TableCell className="px-4 py-2.5 font-medium">
                                        {item?.name}
                                    </TableCell>

                                    <TableCell className="px-4 py-2.5">
                                        <Badge variant="outline">
                                            {typeLabel(txn.type, txn.referenceType)}
                                        </Badge>
                                        {/* {txn.type === "WASTE" && txn.wasteReason && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {WASTE_REASON_OPTIONS.find(
                                                    (o) => o.value === txn.wasteReason
                                                )?.label ?? txn.wasteReason}
                                                {txn.note ? ` — ${txn.note}` : ""}
                                            </p>
                                        )} */}
                                    </TableCell>

                                    <TableCell
                                        className={`px-4 py-2.5 ${quantity >= 0 ? "text-emerald-500" : "text-destructive"
                                            }`}
                                    >
                                        {quantity >= 0 ? "+" : ""}
                                        {txn.quantity.toString()} <span className="text-xs">{item?.unit}</span>
                                    </TableCell>

                                    <TableCell className="px-4 py-2.5">
                                        {txn.balanceAfter.toString()} <span className="text-xs">{item?.unit}</span>
                                    </TableCell>

                                    <TableCell className="px-4 py-2.5">
                                        {source ? (
                                            <Link
                                                href={source.href}
                                                className="text-primary underline-offset-4 hover:underline"
                                            >
                                                {source.label}
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="px-4 py-2.5 text-muted-foreground">
                                        {txn.createdBy.name}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {movements.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-muted-foreground"
                                >
                                    No stock movements found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}