// Straight-line depreciation, computed live rather than stored as a monthly
// ledger — there's no scheduled job in this app to post monthly entries, so
// computing on the fly from the asset's own facts avoids drift or missed
// months entirely. A month only counts as "elapsed" once its purchase-date
// day-of-month has passed, so a Jan 31 purchase doesn't count Feb as a full
// month until Feb has actually reached day 31 (or run out of days).

type DepreciationInput = {
    purchaseCost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    purchaseDate: Date;
    disposalDate: Date | null;
};

export type DepreciationResult = {
    monthlyDepreciation: number;
    monthsElapsed: number;
    accumulatedDepreciation: number;
    bookValue: number;
    isFullyDepreciated: boolean;
};

function monthsBetween(start: Date, end: Date): number {
    let months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) {
        months -= 1;
    }
    return months;
}

export function calculateDepreciation(
    asset: DepreciationInput,
    asOf: Date = new Date()
): DepreciationResult {
    const depreciableAmount = asset.purchaseCost - asset.salvageValue;
    const monthlyDepreciation = depreciableAmount / asset.usefulLifeMonths;

    const effectiveAsOf =
        asset.disposalDate && asset.disposalDate < asOf ? asset.disposalDate : asOf;

    const rawMonthsElapsed = Math.max(0, monthsBetween(asset.purchaseDate, effectiveAsOf));
    const monthsElapsed = Math.min(rawMonthsElapsed, asset.usefulLifeMonths);

    const accumulatedDepreciation = Math.min(
        monthlyDepreciation * monthsElapsed,
        depreciableAmount
    );
    const bookValue = asset.purchaseCost - accumulatedDepreciation;

    return {
        monthlyDepreciation,
        monthsElapsed,
        accumulatedDepreciation,
        bookValue,
        isFullyDepreciated: monthsElapsed >= asset.usefulLifeMonths,
    };
}