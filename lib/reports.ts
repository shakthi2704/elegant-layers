import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateDepreciation } from "@/lib/fixed-asset-depreciation";
import { colomboToday, colomboDayStart, colomboDayEnd } from "@/lib/format";
import { getIncome } from "@/lib/income";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ReportPeriod = { from: string; to: string };

/**
 * Default period is the current Colombo month, up to today. A missing or
 * malformed side is filled in; a reversed range is swapped.
 */
export function resolvePeriod(from?: string, to?: string): ReportPeriod {
    const today = colomboToday();
    const validFrom = from && DATE_RE.test(from) ? from : undefined;
    const validTo = to && DATE_RE.test(to) ? to : undefined;

    const end = validTo ?? today;
    const start = validFrom ?? `${end.slice(0, 8)}01`;

    return start <= end ? { from: start, to: end } : { from: end, to: start };
}

export type ProfitSummary = {
    period: ReportPeriod;
    income: {
        pos: number;
        cakeAdvance: number;
        cakeBalance: number;
        total: number;
        heldOnCancelled: { amount: number; count: number };
        noPriceCount: number;
    };
    purchases: { total: number; count: number };
    expenses: {
        total: number;
        count: number;
        byCategory: { category: string; total: number; count: number }[];
    };
    depreciation: {
        total: number;
        assets: { id: string; name: string; amount: number }[];
    };
    profitBeforeDepreciation: number;
    profitAfterDepreciation: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Cash-basis profit for a period:
 *  income (POS + cake orders) - purchases (counted when bought, paid in full)
 *  - active expenses = profit before depreciation; then period depreciation.
 * Period depreciation = accumulated depreciation at the end of the period
 * minus accumulated depreciation the day before the period started.
 */
export async function getProfitSummary(
    period: ReportPeriod
): Promise<ProfitSummary> {
    const range = {
        gte: colomboDayStart(period.from),
        lte: colomboDayEnd(period.to),
    };

    const [income, purchaseAgg, expenseGroups, assets] = await Promise.all([
        getIncome({ from: period.from, to: period.to }, 1),
        prisma.purchase.aggregate({
            where: { purchaseDate: range },
            _sum: { totalAmount: true },
            _count: { _all: true },
        }),
        prisma.expense.groupBy({
            by: ["category"],
            where: {
                status: "ACTIVE",
                date: range,
            } satisfies Prisma.ExpenseWhereInput,
            _sum: { amount: true },
            _count: { _all: true },
        }),
        prisma.fixedAsset.findMany({
            select: {
                id: true,
                name: true,
                purchaseCost: true,
                salvageValue: true,
                usefulLifeMonths: true,
                purchaseDate: true,
                disposalDate: true,
            },
        }),
    ]);

    // Depreciation: compare accumulated amounts at the two period edges.
    const endAsOf = new Date(`${period.to}T00:00:00Z`);
    const startAsOf = new Date(`${period.from}T00:00:00Z`);
    startAsOf.setUTCDate(startAsOf.getUTCDate() - 1);

    const depreciationAssets: { id: string; name: string; amount: number }[] =
        [];
    for (const asset of assets) {
        const input = {
            purchaseCost: asset.purchaseCost.toNumber(),
            salvageValue: asset.salvageValue.toNumber(),
            usefulLifeMonths: asset.usefulLifeMonths,
            purchaseDate: asset.purchaseDate,
            disposalDate: asset.disposalDate,
        };
        const atEnd = calculateDepreciation(input, endAsOf);
        const atStart = calculateDepreciation(input, startAsOf);
        const amount = round2(
            atEnd.accumulatedDepreciation - atStart.accumulatedDepreciation
        );
        if (amount > 0) {
            depreciationAssets.push({
                id: asset.id,
                name: asset.name,
                amount,
            });
        }
    }
    depreciationAssets.sort((a, b) => b.amount - a.amount);
    const depreciationTotal = round2(
        depreciationAssets.reduce((sum, a) => sum + a.amount, 0)
    );

    const byCategory = expenseGroups
        .map((g) => ({
            category: g.category,
            total: round2(g._sum.amount?.toNumber() ?? 0),
            count: g._count._all,
        }))
        .sort((a, b) => b.total - a.total);
    const expenseTotal = round2(byCategory.reduce((s, g) => s + g.total, 0));
    const expenseCount = byCategory.reduce((s, g) => s + g.count, 0);

    const purchaseTotal = round2(purchaseAgg._sum.totalAmount?.toNumber() ?? 0);

    const incomeTotal = round2(income.totals.total);
    const profitBefore = round2(incomeTotal - purchaseTotal - expenseTotal);

    return {
        period,
        income: {
            pos: round2(income.totals.pos),
            cakeAdvance: round2(income.totals.cakeAdvance),
            cakeBalance: round2(income.totals.cakeBalance),
            total: incomeTotal,
            heldOnCancelled: income.heldOnCancelled,
            noPriceCount: income.noPriceCount,
        },
        purchases: { total: purchaseTotal, count: purchaseAgg._count._all },
        expenses: {
            total: expenseTotal,
            count: expenseCount,
            byCategory,
        },
        depreciation: { total: depreciationTotal, assets: depreciationAssets },
        profitBeforeDepreciation: profitBefore,
        profitAfterDepreciation: round2(profitBefore - depreciationTotal),
    };
}

// ---------------------------------------------------------------------------
// Daily income
// ---------------------------------------------------------------------------

// Formats a moment as its Colombo calendar day ("YYYY-MM-DD"). Kept as one
// reusable formatter because a year of bills can be thousands of rows.
// Must stay in sync with the Asia/Colombo timezone in lib/format.ts.
const colomboDayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
});

export type DailyIncomeRow = {
    /** Colombo day, "YYYY-MM-DD". */
    date: string;
    posCount: number;
    pos: number;
    cakeAdvance: number;
    cakeBalance: number;
    total: number;
};

export type DailyIncomeResult = {
    period: ReportPeriod;
    /** Newest day first; days with no income are left out. */
    rows: DailyIncomeRow[];
    totals: {
        posCount: number;
        pos: number;
        cakeAdvance: number;
        cakeBalance: number;
        total: number;
    };
};

/**
 * Same income rules as getIncome (POS at completion time, cake advance at
 * creation, cake balance at collection, cancelled orders excluded), grouped
 * by Colombo calendar day.
 */
export async function getDailyIncome(
    period: ReportPeriod
): Promise<DailyIncomeResult> {
    const range = {
        gte: colomboDayStart(period.from),
        lte: colomboDayEnd(period.to),
    };
    const [sales, advances, balances, keptAdvances] = await Promise.all([
        prisma.sale.findMany({
            where: { status: "COMPLETED", updatedAt: range },
            select: { total: true, updatedAt: true },
        }),
        prisma.cakeOrder.findMany({
            where: {
                status: { not: "CANCELLED" },
                advancePaid: { gt: 0 },
                createdAt: range,
            },
            select: { advancePaid: true, createdAt: true },
        }),
        prisma.cakeOrder.findMany({
            where: {
                status: "COLLECTED",
                price: { not: null },
                updatedAt: range,
            },
            select: { price: true, advancePaid: true, updatedAt: true },
        }),
        prisma.cakeOrder.findMany({
            where: {
                status: "CANCELLED",
                advanceOutcome: "KEPT",
                advancePaid: { gt: 0 },
                advanceOutcomeAt: range,
            },
            select: { advancePaid: true, advanceOutcomeAt: true },
        }),
    ]);
    const days = new Map<string, DailyIncomeRow>();
    const day = (d: Date) => {
        const key = colomboDayKey.format(d);
        let row = days.get(key);
        if (!row) {
            row = {
                date: key,
                posCount: 0,
                pos: 0,
                cakeAdvance: 0,
                cakeBalance: 0,
                total: 0,
            };
            days.set(key, row);
        }
        return row;
    };

    for (const s of sales) {
        const row = day(s.updatedAt);
        row.posCount += 1;
        row.pos += s.total.toNumber();
    }
    for (const o of advances) {
        day(o.createdAt).cakeAdvance += o.advancePaid?.toNumber() ?? 0;
    }
    // A kept advance on a cancelled order counts on the day it was decided.
    for (const o of keptAdvances) {
        if (o.advanceOutcomeAt) {
            day(o.advanceOutcomeAt).cakeAdvance +=
                o.advancePaid?.toNumber() ?? 0;
        }
    }
    for (const o of balances) {
        day(o.updatedAt).cakeBalance +=
            (o.price?.toNumber() ?? 0) - (o.advancePaid?.toNumber() ?? 0);
    }

    const rows = [...days.values()]
        .map((r) => ({
            ...r,
            pos: round2(r.pos),
            cakeAdvance: round2(r.cakeAdvance),
            cakeBalance: round2(r.cakeBalance),
            total: round2(r.pos + r.cakeAdvance + r.cakeBalance),
        }))
        .sort((a, b) => (a.date < b.date ? 1 : -1));

    const totals = rows.reduce(
        (t, r) => ({
            posCount: t.posCount + r.posCount,
            pos: t.pos + r.pos,
            cakeAdvance: t.cakeAdvance + r.cakeAdvance,
            cakeBalance: t.cakeBalance + r.cakeBalance,
            total: t.total + r.total,
        }),
        { posCount: 0, pos: 0, cakeAdvance: 0, cakeBalance: 0, total: 0 }
    );

    return {
        period,
        rows,
        totals: {
            posCount: totals.posCount,
            pos: round2(totals.pos),
            cakeAdvance: round2(totals.cakeAdvance),
            cakeBalance: round2(totals.cakeBalance),
            total: round2(totals.total),
        },
    };
}


// ---------------------------------------------------------------------------
// Sales by product (POS bills only)
// ---------------------------------------------------------------------------

export type ProductSalesRow = {
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    /** Sum of line subtotals (already after any per-item discount). */
    revenue: number;
};

export type ProductSalesResult = {
    period: ReportPeriod;
    /** Highest revenue first. */
    rows: ProductSalesRow[];
    totals: {
        /** Sum of all line revenue. */
        itemRevenue: number;
        /** Discounts given on whole bills (not on a single item). */
        billDiscounts: number;
        /** What the bills actually brought in: itemRevenue - billDiscounts. */
        posTotal: number;
        billCount: number;
    };
};

/**
 * Completed POS bills only (same completion-time rule as everywhere else).
 * Cake orders have no product lines, so they are not part of this report.
 */
export async function getProductSales(
    period: ReportPeriod
): Promise<ProductSalesResult> {
    const saleWhere = {
        status: "COMPLETED",
        updatedAt: {
            gte: colomboDayStart(period.from),
            lte: colomboDayEnd(period.to),
        },
    } satisfies Prisma.SaleWhereInput;

    const [groups, saleAgg] = await Promise.all([
        prisma.saleItem.groupBy({
            by: ["productId"],
            where: { sale: saleWhere },
            _sum: { quantity: true, subtotal: true },
        }),
        prisma.sale.aggregate({
            where: saleWhere,
            _sum: { discount: true, total: true },
            _count: { _all: true },
        }),
    ]);

    const products = await prisma.product.findMany({
        where: { id: { in: groups.map((g) => g.productId) } },
        select: { id: true, name: true, unit: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const rows: ProductSalesRow[] = groups
        .map((g) => {
            const product = productById.get(g.productId);
            return {
                productId: g.productId,
                name: product?.name ?? "Unknown product",
                unit: product?.unit ?? "PCS",
                quantity: g._sum.quantity?.toNumber() ?? 0,
                revenue: round2(g._sum.subtotal?.toNumber() ?? 0),
            };
        })
        .sort((a, b) => b.revenue - a.revenue);

    const itemRevenue = round2(rows.reduce((s, r) => s + r.revenue, 0));

    return {
        period,
        rows,
        totals: {
            itemRevenue,
            billDiscounts: round2(saleAgg._sum.discount?.toNumber() ?? 0),
            posTotal: round2(saleAgg._sum.total?.toNumber() ?? 0),
            billCount: saleAgg._count._all,
        },
    };
}

// ---------------------------------------------------------------------------
// Waste (stock thrown away)
// ---------------------------------------------------------------------------

const WASTE_REASONS = ["EXPIRED", "NOT_COLLECTED", "DAMAGED", "OTHER"] as const;
type WasteReasonKey = (typeof WASTE_REASONS)[number];

export type WasteReportRow = {
    key: string;
    name: string;
    unit: string;
    kind: "Ingredient" | "Product";
    /** Quantity thrown away per reason (positive numbers). */
    byReason: Record<WasteReasonKey, number>;
    total: number;
    /** How many waste entries were recorded. */
    entries: number;
};

export type WasteReportResult = {
    period: ReportPeriod;
    rows: WasteReportRow[];
    totalEntries: number;
};

/**
 * Waste movements (type WASTE) in the period, by item and reason.
 * The period uses the movement's recording time, as the Movements tab does.
 */
export async function getWasteReport(
    period: ReportPeriod
): Promise<WasteReportResult> {
    const movements = await prisma.inventoryTransaction.findMany({
        where: {
            type: "WASTE",
            createdAt: {
                gte: colomboDayStart(period.from),
                lte: colomboDayEnd(period.to),
            },
        },
        select: {
            quantity: true,
            wasteReason: true,
            ingredientId: true,
            productId: true,
            ingredient: { select: { name: true, unit: true } },
            product: { select: { name: true, unit: true } },
        },
    });

    const items = new Map<string, WasteReportRow>();

    for (const m of movements) {
        const isIngredient = m.ingredientId !== null;
        const info = isIngredient ? m.ingredient : m.product;
        const id = (isIngredient ? m.ingredientId : m.productId) ?? "unknown";
        const key = `${isIngredient ? "i" : "p"}-${id}`;

        let row = items.get(key);
        if (!row) {
            row = {
                key,
                name: info?.name ?? "Unknown item",
                unit: info?.unit ?? "",
                kind: isIngredient ? "Ingredient" : "Product",
                byReason: { EXPIRED: 0, NOT_COLLECTED: 0, DAMAGED: 0, OTHER: 0 },
                total: 0,
                entries: 0,
            };
            items.set(key, row);
        }

        // Waste is stored as a negative quantity; show it as a positive amount.
        const amount = Math.abs(m.quantity.toNumber());
        row.byReason[m.wasteReason ?? "OTHER"] += amount;
        row.total += amount;
        row.entries += 1;
    }

    const rows = [...items.values()]
        .map((r) => ({
            ...r,
            byReason: {
                EXPIRED: Math.round(r.byReason.EXPIRED * 1000) / 1000,
                NOT_COLLECTED: Math.round(r.byReason.NOT_COLLECTED * 1000) / 1000,
                DAMAGED: Math.round(r.byReason.DAMAGED * 1000) / 1000,
                OTHER: Math.round(r.byReason.OTHER * 1000) / 1000,
            },
            total: Math.round(r.total * 1000) / 1000,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return {
        period,
        rows,
        totalEntries: movements.length,
    };
}