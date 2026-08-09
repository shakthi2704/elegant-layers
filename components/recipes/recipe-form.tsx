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

type Ingredient = {
    id: string;
    name: string;
    unit: string;
};

type Row = {
    key: string;
    ingredientId: string;
    quantity: string;
};

let rowKeySeed = 0;
function newRowKey() {
    rowKeySeed += 1;
    return `row-${rowKeySeed}-${Date.now()}`;
}

export function RecipeForm({
    action,
    productId,
    productName,
    ingredients,
    defaultItems,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    productId: string;
    productName: string;
    ingredients: Ingredient[];
    defaultItems: { ingredientId: string; quantity: string }[];
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const [rows, setRows] = useState<Row[]>(() =>
        defaultItems.length > 0
            ? defaultItems.map((item) => ({ key: newRowKey(), ...item }))
            : [{ key: newRowKey(), ingredientId: "", quantity: "" }]
    );

    const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

    function addRow() {
        setRows((prev) => [...prev, { key: newRowKey(), ingredientId: "", quantity: "" }]);
    }

    function removeRow(key: string) {
        setRows((prev) => prev.filter((row) => row.key !== key));
    }

    function updateRow(key: string, patch: Partial<Row>) {
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    }

    return (
        <form action={formAction} className="max-w-2xl space-y-5">
            <input type="hidden" name="productId" value={productId} />

            <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-medium">{productName}</p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ingredient</TableHead>
                            <TableHead className="w-40">Quantity per unit</TableHead>
                            <TableHead className="w-16">Unit</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => {
                            const selectedIngredient = ingredientById.get(row.ingredientId);
                            const takenElsewhere = new Set(
                                rows.filter((r) => r.key !== row.key).map((r) => r.ingredientId)
                            );

                            return (
                                <TableRow key={row.key}>
                                    <TableCell>
                                        <Select
                                            name="ingredientId"
                                            value={row.ingredientId}
                                            onValueChange={(value) => updateRow(row.key, { ingredientId: value ?? "" })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select ingredient" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ingredients
                                                    .filter((i) => !takenElsewhere.has(i.id))
                                                    .map((i) => (
                                                        <SelectItem key={i.id} value={i.id}>
                                                            {i.name}
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
                                            placeholder="0.000"
                                            value={row.quantity}
                                            onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {selectedIngredient?.unit ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRow(row.key)}
                                            disabled={rows.length === 1}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-4" />
                Add Ingredient
            </Button>

            {state.fieldErrors?.items && (
                <p className="text-sm text-destructive">{state.fieldErrors.items[0]}</p>
            )}
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <div className="flex gap-3">
                <Button type="submit" disabled={pending}>
                    {pending ? "Saving..." : "Save Recipe"}
                </Button>
            </div>
        </form>
    );
}