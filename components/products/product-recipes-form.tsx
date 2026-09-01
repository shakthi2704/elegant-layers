"use client";

import { useActionState, useState } from "react";
import { X, Plus } from "lucide-react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type RecipeComponent = { id: string; name: string };

type Row = {
    key: string;
    recipeId: string;
    quantity: string;
};

let rowKeySeed = 0;
function newRowKey() {
    rowKeySeed += 1;
    return `row-${rowKeySeed}-${Date.now()}`;
}

export function ProductRecipesForm({
    action,
    recipes,
    defaultComponents,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    recipes: RecipeComponent[];
    defaultComponents: { recipeId: string; quantity: string }[];
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const [rows, setRows] = useState<Row[]>(() =>
        defaultComponents.map((c) => ({ key: newRowKey(), ...c }))
    );

    function addRow() {
        setRows((prev) => [...prev, { key: newRowKey(), recipeId: "", quantity: "1" }]);
    }

    function removeRow(key: string) {
        setRows((prev) => prev.filter((row) => row.key !== key));
    }

    function updateRow(key: string, patch: Partial<Row>) {
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    }

    return (
        <form action={formAction} className="max-w-2xl space-y-5">
            {recipes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No recipe components exist yet — create one in Recipe Components
                    first, then come back here to attach it.
                </p>
            ) : (
                <>
                    <div className="overflow-hidden rounded-lg border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recipe Component</TableHead>
                                    <TableHead className="w-32">Quantity</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => {
                                    const takenElsewhere = new Set(
                                        rows.filter((r) => r.key !== row.key).map((r) => r.recipeId)
                                    );

                                    return (
                                        <TableRow key={row.key}>
                                            <TableCell>
                                                <Select
                                                    name="recipeId"
                                                    value={row.recipeId}
                                                    onValueChange={(value) => updateRow(row.key, { recipeId: value ?? "" })}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select component">
                                                            {(value: string | null) =>
                                                                recipes.find((r) => r.id === value)?.name ?? "Select component"
                                                            }
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {recipes
                                                            .filter((r) => !takenElsewhere.has(r.id))
                                                            .map((r) => (
                                                                <SelectItem key={r.id} value={r.id}>
                                                                    {r.name}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    name="quantity"
                                                    type="number"
                                                    step="0.001"
                                                    min="0.001"
                                                    placeholder="1"
                                                    value={row.quantity}
                                                    onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRow(row.key)}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                                            No components attached yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Button type="button" variant="outline" size="sm" onClick={addRow}>
                        <Plus className="size-4" />
                        Add Component
                    </Button>
                </>
            )}

            {state.fieldErrors?.components && (
                <p className="text-sm text-destructive">{state.fieldErrors.components[0]}</p>
            )}
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state.success && (
                <p className="rounded-md border border-emerald-600/20 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                    Saved.
                </p>
            )}

            <Button type="submit" disabled={pending || recipes.length === 0}>
                {pending ? "Saving..." : "Save Components"}
            </Button>
        </form>
    );
}