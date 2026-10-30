"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { addProductionIngredients } from "@/app/(dashboard)/production/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type ProductionIngredientOption = {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
};

type Row = {
    key: string;
    ingredientId: string;
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

export function AddProductionIngredientsDialog({
    productionId,
    ingredients,
}: {
    productionId: string;
    ingredients: ProductionIngredientOption[];
}) {
    const [open, setOpen] = useState(false);
    const keySeed = useRef(1);
    const newRow = (): Row => {
        keySeed.current += 1;
        return { key: `row-${keySeed.current}`, ingredientId: "", quantity: "" };
    };

    const [rows, setRows] = useState<Row[]>([
        { key: "row-1", ingredientId: "", quantity: "" },
    ]);
    const [reason, setReason] = useState("");
    const [state, formAction, pending] = useActionState(
        addProductionIngredients.bind(null, productionId),
        {}
    );

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    const byId = new Map(ingredients.map((i) => [i.id, i]));
    const chosenIds = new Set(
        rows.map((r) => r.ingredientId).filter((id) => id !== "")
    );

    const analysed = rows.map((row) => {
        const ingredient = byId.get(row.ingredientId);
        const quantity = Number(row.quantity);
        const blank = row.ingredientId === "" && row.quantity.trim() === "";
        const hasQuantity =
            row.quantity.trim() !== "" &&
            Number.isFinite(quantity) &&
            quantity >= 0.001;
        return {
            row,
            ingredient,
            quantity,
            blank,
            incomplete: !blank && (!ingredient || !hasQuantity),
            short:
                !!ingredient && hasQuantity && quantity > ingredient.currentStock,
        };
    });

    const filledCount = analysed.filter((a) => !a.blank).length;
    const anyIncomplete = analysed.some((a) => a.incomplete);
    const anyShort = analysed.some((a) => a.short);
    const reasonMissing = reason.trim().length < 3;

    function updateRow(key: string, patch: Partial<Row>) {
        setRows((prev) =>
            prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
        );
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) {
                    setRows([newRow()]);
                    setReason("");
                }
            }}
        >
            <AlertDialogTrigger
                render={<Button variant="outline">Add forgotten ingredients</Button>}
            />
            <AlertDialogContent className="max-h-[90vh] overflow-y-auto data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Add forgotten ingredients</AlertDialogTitle>
                    <AlertDialogDescription>
                        List what was used in this production but not taken off
                        stock. It is deducted now and recorded against this
                        production, with your reason.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form action={formAction} className="space-y-4">
                    {rows.length > 0 && (
                        <ul className="space-y-3">
                            {analysed.map((a) => (
                                <li key={a.row.key} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="min-w-0 flex-1">
                                            <Select
                                                name="ingredientId"
                                                value={a.row.ingredientId}
                                                onValueChange={(value) =>
                                                    updateRow(a.row.key, {
                                                        ingredientId: value ?? "",
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select ingredient">
                                                        {(value: string | null) =>
                                                            byId.get(value ?? "")?.name ??
                                                            "Select ingredient"
                                                        }
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ingredients.length === 0 && (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                            No ingredients yet
                                                        </div>
                                                    )}
                                                    {ingredients.map((i) => (
                                                        <SelectItem
                                                            key={i.id}
                                                            value={i.id}
                                                            disabled={
                                                                chosenIds.has(i.id) &&
                                                                i.id !== a.row.ingredientId
                                                            }
                                                        >
                                                            {i.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Input
                                            name="quantity"
                                            type="number"
                                            step="0.001"
                                            min="0.001"
                                            placeholder="0.000"
                                            className="w-28"
                                            value={a.row.quantity}
                                            onChange={(e) =>
                                                updateRow(a.row.key, {
                                                    quantity: e.target.value,
                                                })
                                            }
                                        />

                                        <span className="w-8 text-sm text-muted-foreground">
                                            {a.ingredient ? unitLabel(a.ingredient.unit) : ""}
                                        </span>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Remove ingredient"
                                            onClick={() =>
                                                setRows((prev) =>
                                                    prev.filter((r) => r.key !== a.row.key)
                                                )
                                            }
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>

                                    {a.ingredient && (
                                        <p
                                            className={
                                                a.short
                                                    ? "text-xs font-medium text-destructive"
                                                    : "text-xs text-muted-foreground"
                                            }
                                        >
                                            {a.short
                                                ? `Only ${a.ingredient.currentStock} ${unitLabel(a.ingredient.unit)} in stock`
                                                : `In stock: ${a.ingredient.currentStock} ${unitLabel(a.ingredient.unit)}`}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRows((prev) => [...prev, newRow()])}
                    >
                        <Plus className="size-4" />
                        Add ingredient
                    </Button>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            name="reason"
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={300}
                            placeholder="e.g. Cocoa was missing from the recipe"
                        />
                        {state.fieldErrors?.reason && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.reason[0]}
                            </p>
                        )}
                    </div>

                    {anyIncomplete && (
                        <p className="text-sm text-destructive">
                            Every row needs an ingredient and a quantity. Fill it in
                            or remove the row.
                        </p>
                    )}
                    {anyShort && (
                        <p className="text-sm text-destructive">
                            Not enough stock for the rows marked in red. Lower the
                            quantity, or record a purchase first.
                        </p>
                    )}
                    {state.error && (
                        <p className="text-sm text-destructive">{state.error}</p>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Back</AlertDialogCancel>
                        <Button
                            type="submit"
                            disabled={
                                pending ||
                                filledCount === 0 ||
                                anyIncomplete ||
                                anyShort ||
                                reasonMissing
                            }
                        >
                            {pending ? "Saving..." : "Add to production"}
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}