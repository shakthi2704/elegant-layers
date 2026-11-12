"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type IcingOption = {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
};

export type IcingRow = {
    key: string;
    productId: string;
    quantity: string;
};

const UNIT_LABELS: Record<string, string> = {
    KG: "kg",
    G: "g",
    L: "L",
    ML: "ml",
    PCS: "pcs",
};

function unitLabel(unit: string) {
    return UNIT_LABELS[unit] ?? unit;
}

// "0.2 kg = 200 g", so the baker can check the amount at a glance.
function smallUnitHint(unit: string, quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    if (unit === "KG") return `= ${Math.round(quantity * 1000)} g`;
    if (unit === "L") return `= ${Math.round(quantity * 1000)} ml`;
    return null;
}

let rowSeed = 0;

export function newIcingRow(): IcingRow {
    rowSeed += 1;
    return { key: `icing-${rowSeed}`, productId: "", quantity: "" };
}

/** Counts used by the parent dialog to enable or disable its save button. */
export function analyseIcing(rows: IcingRow[], icings: IcingOption[]) {
    const byId = new Map(icings.map((i) => [i.id, i]));
    let filledCount = 0;
    let anyIncomplete = false;
    let anyShort = false;

    for (const row of rows) {
        const blank = row.productId === "" && row.quantity.trim() === "";
        if (blank) continue;
        filledCount += 1;

        const icing = byId.get(row.productId);
        const quantity = Number(row.quantity);
        const hasQuantity =
            row.quantity.trim() !== "" &&
            Number.isFinite(quantity) &&
            quantity >= 0.001;
        if (!icing || !hasQuantity) {
            anyIncomplete = true;
            continue;
        }
        if (quantity > icing.currentStock) anyShort = true;
    }

    return { filledCount, anyIncomplete, anyShort };
}

export function IcingPicker({
    icings,
    rows,
    onChange,
}: {
    icings: IcingOption[];
    rows: IcingRow[];
    onChange: (rows: IcingRow[]) => void;
}) {
    // No icing products yet: nothing to show.
    if (icings.length === 0) return null;

    const byId = new Map(icings.map((i) => [i.id, i]));
    const chosenIds = new Set(
        rows.map((r) => r.productId).filter((id) => id !== "")
    );

    function updateRow(key: string, patch: Partial<IcingRow>) {
        onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    }

    return (
        <div className="space-y-3 rounded-md border border-border p-3">
            <div>
                <p className="text-sm font-medium">Icing from stock</p>
                <p className="text-xs text-muted-foreground">
                    Pick each icing you used and how much. Each one is taken off
                    its own stock.
                </p>
            </div>

            {rows.length > 0 && (
                <ul className="space-y-3">
                    {rows.map((row) => {
                        const icing = byId.get(row.productId);
                        const quantity = Number(row.quantity);
                        const hasQuantity =
                            row.quantity.trim() !== "" &&
                            Number.isFinite(quantity) &&
                            quantity >= 0.001;
                        const short =
                            !!icing && hasQuantity && quantity > icing.currentStock;
                        const hint = icing
                            ? smallUnitHint(icing.unit, quantity)
                            : null;

                        return (
                            <li key={row.key} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="min-w-0 flex-1">
                                        <Select
                                            name="icingProductId"
                                            value={row.productId}
                                            onValueChange={(value) =>
                                                updateRow(row.key, {
                                                    productId: value ?? "",
                                                })
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select icing">
                                                    {(value: string | null) =>
                                                        byId.get(value ?? "")?.name ??
                                                        "Select icing"
                                                    }
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {icings.map((i) => (
                                                    <SelectItem
                                                        key={i.id}
                                                        value={i.id}
                                                        disabled={
                                                            chosenIds.has(i.id) &&
                                                            i.id !== row.productId
                                                        }
                                                    >
                                                        {i.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Input
                                        name="icingQuantity"
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        placeholder="0.000"
                                        className="w-28"
                                        value={row.quantity}
                                        onChange={(e) =>
                                            updateRow(row.key, {
                                                quantity: e.target.value,
                                            })
                                        }
                                    />

                                    <span className="w-8 text-sm text-muted-foreground">
                                        {icing ? unitLabel(icing.unit) : ""}
                                    </span>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Remove icing"
                                        onClick={() =>
                                            onChange(
                                                rows.filter((r) => r.key !== row.key)
                                            )
                                        }
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>

                                {icing && (
                                    <p
                                        className={
                                            short
                                                ? "text-xs font-medium text-destructive"
                                                : "text-xs text-muted-foreground"
                                        }
                                    >
                                        {short
                                            ? `Only ${icing.currentStock} ${unitLabel(icing.unit)} in stock`
                                            : `In stock: ${icing.currentStock} ${unitLabel(icing.unit)}`}
                                        {hint ? ` · ${hint}` : ""}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([...rows, newIcingRow()])}
            >
                <Plus className="size-4" />
                Add icing
            </Button>
        </div>
    );
}