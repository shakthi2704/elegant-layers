"use client";

import { useActionState, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    TableFooter,
} from "@/components/ui/table";

type Supplier = { id: string; name: string };
type Ingredient = { id: string; name: string; unit: string };

type Row = {
    key: string;
    ingredientId: string;
    quantity: string;
    unitCost: string;
};

let rowKeySeed = 0;
function newRowKey() {
    rowKeySeed += 1;
    return `row-${rowKeySeed}-${Date.now()}`;
}

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

function money(n: number) {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PurchaseForm({
    action,
    suppliers,
    ingredients,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    suppliers: Supplier[];
    ingredients: Ingredient[];
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const [supplierId, setSupplierId] = useState("");
    const [rows, setRows] = useState<Row[]>([
        { key: newRowKey(), ingredientId: "", quantity: "", unitCost: "" },
    ]);

    const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

    const total = useMemo(
        () =>
            rows.reduce((sum, row) => {
                const qty = Number(row.quantity) || 0;
                const cost = Number(row.unitCost) || 0;
                return sum + qty * cost;
            }, 0),
        [rows]
    );

    function addRow() {
        setRows((prev) => [
            ...prev,
            { key: newRowKey(), ingredientId: "", quantity: "", unitCost: "" },
        ]);
    }

    function removeRow(key: string) {
        setRows((prev) => prev.filter((row) => row.key !== key));
    }

    function updateRow(key: string, patch: Partial<Row>) {
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    }

    return (
        <form action={formAction} className="max-w-3xl space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="supplierId">Supplier</Label>
                    <Select name="supplierId" value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
                        <SelectTrigger id="supplierId" className="w-full">
                            {/* <SelectValue placeholder="Select supplier" /> */}
                            <SelectValue placeholder="Select supplier">
                                {(value: string | null) =>
                                    suppliers.find((s) => s.id === value)?.name ?? "Select supplier"
                                }
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {state.fieldErrors?.supplierId && (
                        <p className="text-sm text-destructive">{state.fieldErrors.supplierId[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                        id="purchaseDate"
                        name="purchaseDate"
                        type="date"
                        defaultValue={todayIsoDate()}
                        required
                    />
                    {state.fieldErrors?.purchaseDate && (
                        <p className="text-sm text-destructive">{state.fieldErrors.purchaseDate[0]}</p>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ingredient</TableHead>
                            <TableHead className="w-32">Quantity</TableHead>
                            <TableHead className="w-16">Unit</TableHead>
                            <TableHead className="w-32">Unit Cost</TableHead>
                            <TableHead className="w-28">Subtotal</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => {
                            const selectedIngredient = ingredientById.get(row.ingredientId);
                            const rowTotal = (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);

                            return (
                                <TableRow key={row.key}>
                                    <TableCell>
                                        <Select
                                            name="ingredientId"
                                            value={row.ingredientId}
                                            onValueChange={(value) => updateRow(row.key, { ingredientId: value ?? "" })}
                                        >
                                            <SelectTrigger className="w-full">
                                                {/* <SelectValue placeholder="Select ingredient" /> */}
                                                <SelectValue placeholder="Select ingredient">
                                                    {(value: string | null) =>
                                                        ingredients.find((i) => i.id === value)?.name ?? "Select ingredient"
                                                    }
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ingredients.map((i) => (
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
                                        <Input
                                            name="unitCost"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            value={row.unitCost}
                                            onChange={(e) => updateRow(row.key, { unitCost: e.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        Rs. {money(rowTotal)}
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



            <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                    <Plus className="size-4" />
                    Add Ingredient
                </Button>
                <p className="text-sm font-medium">
                    Total: <span className="text-base">Rs. {money(total)}</span>
                </p>
            </div>


            {state.fieldErrors?.items && (
                <p className="text-sm text-destructive">{state.fieldErrors.items[0]}</p>
            )}
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Record Purchase"}
            </Button>
        </form>
    );
}