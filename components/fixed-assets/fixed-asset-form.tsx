"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

export function FixedAssetForm({
    action,
    defaultValues,
    submitLabel,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    defaultValues?: {
        name: string;
        category: string | null;
        purchaseDate: string;
        purchaseCost: number | string;
        salvageValue: number | string;
        usefulLifeMonths: number | string;
        notes: string | null;
    };
    submitLabel: string;
}) {
    const [state, formAction, pending] = useActionState(action, {});

    return (
        <form
            key={defaultValues ? JSON.stringify(defaultValues) : "new"}
            action={formAction}
            className="max-w-md space-y-5"
        >
            <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={defaultValues?.name} required />
                {state.fieldErrors?.name && (
                    <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                    id="category"
                    name="category"
                    placeholder="e.g. Kitchen Equipment, Furniture"
                    defaultValue={defaultValues?.category ?? ""}
                />
                {state.fieldErrors?.category && (
                    <p className="text-sm text-destructive">{state.fieldErrors.category[0]}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                        id="purchaseDate"
                        name="purchaseDate"
                        type="date"
                        defaultValue={defaultValues?.purchaseDate ?? todayIsoDate()}
                        required
                    />
                    {state.fieldErrors?.purchaseDate && (
                        <p className="text-sm text-destructive">{state.fieldErrors.purchaseDate[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="usefulLifeMonths">Useful Life (months)</Label>
                    <Input
                        id="usefulLifeMonths"
                        name="usefulLifeMonths"
                        type="number"
                        step="1"
                        min="1"
                        defaultValue={defaultValues?.usefulLifeMonths}
                        required
                    />
                    {state.fieldErrors?.usefulLifeMonths && (
                        <p className="text-sm text-destructive">{state.fieldErrors.usefulLifeMonths[0]}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="purchaseCost">Purchase Cost (Rs.)</Label>
                    <Input
                        id="purchaseCost"
                        name="purchaseCost"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={defaultValues?.purchaseCost}
                        required
                    />
                    {state.fieldErrors?.purchaseCost && (
                        <p className="text-sm text-destructive">{state.fieldErrors.purchaseCost[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="salvageValue">Salvage Value (Rs.)</Label>
                    <Input
                        id="salvageValue"
                        name="salvageValue"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={defaultValues?.salvageValue ?? 0}
                    />
                    {state.fieldErrors?.salvageValue && (
                        <p className="text-sm text-destructive">{state.fieldErrors.salvageValue[0]}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Estimated resale/scrap value at the end of its useful life.
                    </p>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Serial number, location, supplier, etc."
                    defaultValue={defaultValues?.notes ?? ""}
                />
                {state.fieldErrors?.notes && (
                    <p className="text-sm text-destructive">{state.fieldErrors.notes[0]}</p>
                )}
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state.success && <p className="text-sm text-muted-foreground">Saved.</p>}

            <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : submitLabel}
            </Button>
        </form>
    );
}