import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { colomboDayStart, colomboDayEnd } from "@/lib/format";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const INCOME_SOURCES = ["POS", "CAKE_ADVANCE", "CAKE_BALANCE"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

export type IncomeFilters = {
    source?: string;
    from?: string;
    to?: string;
};

export type IncomeRow = {
    key: string;
    source: IncomeSource;
    date: Date;
    label: string;
    href: string;
    amount: number;
    /** Shown next to the amount when the figure can't be trusted. */
    flag?: string;
};

export type IncomeResult = {
    rows: IncomeRow[];
    /** How many rows match the filters in total (rows may be capped). */
    matchCount: number;
    totals: {
        total: number;
        pos: number;
        cakeAdvance: number;
        cakeBalance: number;
    };
    /** Advances on cancelled orders with no outcome recorded yet — not counted. */
    heldOnCancelled: { amount: number; count: number };
    /** Collected orders with no price, so no balance could be counted. */
    noPriceCount: number;
};

function dayRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    const validFrom = from && DATE_RE.test(from) ? from : undefined;
    const validTo = to && DATE_RE.test(to) ? to : undefined;
    if (!validFrom && !validTo) return undefined;
    return {
        gte: validFrom ? colomboDayStart(validFrom) : undefined,
        lte: validTo ? colomboDayEnd(validTo) : undefined,
    };
}

/**
 * Income rules:
 *  - POS bill: COMPLETED bills, counted at Sale.updatedAt (completion time).
 *  - Cake advance: advancePaid on non-cancelled orders, counted at createdAt.
 *  - Kept advance: advancePaid on CANCELLED orders whose outcome is KEPT,
 *    counted at advanceOutcomeAt. It is part of the "cake advance" source.
 *  - Cake balance: price - advancePaid on COLLECTED orders, counted at updatedAt
 *    (safe: Collected orders can't be edited, so updatedAt is the collection time).
 *  - Refunded advances are never income. Advances on cancelled orders with no
 *    outcome yet are reported separately in heldOnCancelled.
 */
export async function getIncome(
    filters: IncomeFilters,
    rowLimit = 100
): Promise<IncomeResult> {
    const range = dayRange(filters.from, filters.to);
    const source = INCOME_SOURCES.find((s) => s === filters.source);
    const wantPos = !source || source === "POS";
    const wantAdvance = !source || source === "CAKE_ADVANCE";
    const wantBalance = !source || source === "CAKE_BALANCE";

    const posWhere: Prisma.SaleWhereInput = {
        status: "COMPLETED",
        updatedAt: range,
    };
    const advanceWhere: Prisma.CakeOrderWhereInput = {
        status: { not: "CANCELLED" },
        advancePaid: { gt: 0 },
        createdAt: range,
    };
    const keptWhere: Prisma.CakeOrderWhereInput = {
        status: "CANCELLED",
        advanceOutcome: "KEPT",
        advancePaid: { gt: 0 },
        advanceOutcomeAt: range ?? { not: null },
    };
    const balanceWhere: Prisma.CakeOrderWhereInput = {
        status: "COLLECTED",
        updatedAt: range,
    };
    const heldWhere: Prisma.CakeOrderWhereInput = {
        status: "CANCELLED",
        advanceOutcome: null,
        advancePaid: { gt: 0 },
        createdAt: range,
    };

    const customerSelect = { customer: { select: { name: true } } } as const;

    const [
        posRows,
        posAgg,
        advRows,
        advAgg,
        keptRows,
        keptAgg,
        balRows,
        balAgg,
        noPriceCount,
        heldAgg,
    ] = await Promise.all([
        prisma.sale.findMany({
            where: posWhere,
            select: { id: true, saleNumber: true, total: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: rowLimit,
        }),
        prisma.sale.aggregate({
            where: posWhere,
            _sum: { total: true },
            _count: { _all: true },
        }),
        prisma.cakeOrder.findMany({
            where: advanceWhere,
            select: {
                id: true,
                cakeName: true,
                advancePaid: true,
                createdAt: true,
                ...customerSelect,
            },
            orderBy: { createdAt: "desc" },
            take: rowLimit,
        }),
        prisma.cakeOrder.aggregate({
            where: advanceWhere,
            _sum: { advancePaid: true },
            _count: { _all: true },
        }),
        prisma.cakeOrder.findMany({
            where: keptWhere,
            select: {
                id: true,
                cakeName: true,
                advancePaid: true,
                advanceOutcomeAt: true,
                ...customerSelect,
            },
            orderBy: { advanceOutcomeAt: "desc" },
            take: rowLimit,
        }),
        prisma.cakeOrder.aggregate({
            where: keptWhere,
            _sum: { advancePaid: true },
            _count: { _all: true },
        }),
        prisma.cakeOrder.findMany({
            where: balanceWhere,
            select: {
                id: true,
                cakeName: true,
                price: true,
                advancePaid: true,
                updatedAt: true,
                ...customerSelect,
            },
            orderBy: { updatedAt: "desc" },
            take: rowLimit,
        }),
        prisma.cakeOrder.aggregate({
            where: { ...balanceWhere, price: { not: null } },
            _sum: { price: true, advancePaid: true },
            _count: { _all: true },
        }),
        prisma.cakeOrder.count({ where: { ...balanceWhere, price: null } }),
        prisma.cakeOrder.aggregate({
            where: heldWhere,
            _sum: { advancePaid: true },
            _count: { _all: true },
        }),
    ]);

    const rows: IncomeRow[] = [];

    if (wantPos) {
        for (const s of posRows) {
            rows.push({
                key: `pos-${s.id}`,
                source: "POS",
                date: s.updatedAt,
                label: s.saleNumber,
                href: `/pos/${s.id}`,
                amount: s.total.toNumber(),
            });
        }
    }

    if (wantAdvance) {
        for (const o of advRows) {
            rows.push({
                key: `adv-${o.id}`,
                source: "CAKE_ADVANCE",
                date: o.createdAt,
                label: `${o.cakeName} — ${o.customer.name}`,
                href: `/cake-orders/${o.id}`,
                amount: o.advancePaid?.toNumber() ?? 0,
            });
        }
        for (const o of keptRows) {
            rows.push({
                key: `kept-${o.id}`,
                source: "CAKE_ADVANCE",
                date: o.advanceOutcomeAt ?? new Date(0),
                label: `${o.cakeName} — ${o.customer.name} (kept advance, order cancelled)`,
                href: `/cake-orders/${o.id}`,
                amount: o.advancePaid?.toNumber() ?? 0,
            });
        }
    }

    if (wantBalance) {
        for (const o of balRows) {
            const hasPrice = o.price !== null;
            rows.push({
                key: `bal-${o.id}`,
                source: "CAKE_BALANCE",
                date: o.updatedAt,
                label: `${o.cakeName} — ${o.customer.name}`,
                href: `/cake-orders/${o.id}`,
                amount: hasPrice
                    ? o.price!.toNumber() - (o.advancePaid?.toNumber() ?? 0)
                    : 0,
                flag: hasPrice ? undefined : "No price set",
            });
        }
    }

    rows.sort((a, b) => b.date.getTime() - a.date.getTime());

    const pos = wantPos ? posAgg._sum.total?.toNumber() ?? 0 : 0;
    const cakeAdvance = wantAdvance
        ? (advAgg._sum.advancePaid?.toNumber() ?? 0) +
        (keptAgg._sum.advancePaid?.toNumber() ?? 0)
        : 0;
    const cakeBalance = wantBalance
        ? (balAgg._sum.price?.toNumber() ?? 0) -
        (balAgg._sum.advancePaid?.toNumber() ?? 0)
        : 0;

    const matchCount =
        (wantPos ? posAgg._count._all : 0) +
        (wantAdvance ? advAgg._count._all + keptAgg._count._all : 0) +
        (wantBalance ? balAgg._count._all + noPriceCount : 0);

    return {
        rows: rows.slice(0, rowLimit),
        matchCount,
        totals: {
            total: pos + cakeAdvance + cakeBalance,
            pos,
            cakeAdvance,
            cakeBalance,
        },
        heldOnCancelled: {
            amount: heldAgg._sum.advancePaid?.toNumber() ?? 0,
            count: heldAgg._count._all,
        },
        noPriceCount: wantBalance ? noPriceCount : 0,
    };
}