"use client";

import { useActionState, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/table";

type Supplier = { id: string; name: string };
type Item = { id: string; name: string; unit: string };
type ItemType = "INGREDIENT" | "PRODUCT";

type Row = {
    key: string;
    itemType: ItemType;
    itemId: string;
    name: string;
    unit: string;
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
    products,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    suppliers: Supplier[];
    ingredients: Item[];
    products: Item[];
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const [supplierId, setSupplierId] = useState("");
    const [rows, setRows] = useState<Row[]>([]);

    // The picker: choose Type + Item here, then "Add" drops it into the table
    // below as its own row — the table itself never shows Type/Item dropdowns.
    const [pickerType, setPickerType] = useState<ItemType>("INGREDIENT");
    const [pickerItemId, setPickerItemId] = useState("");

    const pickerOptions = pickerType === "INGREDIENT" ? ingredients : products;
    const alreadyAddedIds = new Set(
        rows.filter((r) => r.itemType === pickerType).map((r) => r.itemId)
    );
    const availablePickerOptions = pickerOptions.filter((i) => !alreadyAddedIds.has(i.id));

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
        const item = pickerOptions.find((i) => i.id === pickerItemId);
        if (!item) return;

        setRows((prev) => [
            ...prev,
            {
                key: newRowKey(),
                itemType: pickerType,
                itemId: item.id,
                name: item.name,
                unit: item.unit,
                quantity: "",
                unitCost: "",
            },
        ]);
        setPickerItemId("");
    }

    function removeRow(key: string) {
        setRows((prev) => prev.filter((row) => row.key !== key));
    }

    function updateRow(key: string, patch: Partial<Row>) {
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    }

    return (
        <form action={formAction} className="max-w-4xl space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="supplierId">Supplier</Label>
                    <Select name="supplierId" value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
                        <SelectTrigger id="supplierId" className="w-full">
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

            {/* Picker — pick what you're adding, then Add drops it into the table below */}
            <div className="flex items-end gap-3 rounded-lg border border-border p-4">
                <div className="w-40 space-y-1.5">
                    <Label>Type</Label>
                    <Select
                        value={pickerType}
                        onValueChange={(value) => {
                            setPickerType((value as ItemType) ?? "INGREDIENT");
                            setPickerItemId("");
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Type">
                                {(value: string | null) => (value === "PRODUCT" ? "Product" : "Ingredient")}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INGREDIENT">Ingredient</SelectItem>
                            <SelectItem value="PRODUCT">Product</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 space-y-1.5">
                    <Label>{pickerType === "PRODUCT" ? "Product" : "Ingredient"}</Label>
                    <Select key={pickerType} value={pickerItemId} onValueChange={(v) => setPickerItemId(v ?? "")}>
                        <SelectTrigger className="w-full">
                            <SelectValue
                                placeholder={pickerType === "PRODUCT" ? "Select product" : "Select ingredient"}
                            >
                                {(value: string | null) =>
                                    pickerOptions.find((i) => i.id === value)?.name ??
                                    (pickerType === "PRODUCT" ? "Select product" : "Select ingredient")
                                }
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {availablePickerOptions.length === 0 && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    {pickerOptions.length === 0 ? "None available" : "All already added"}
                                </div>
                            )}
                            {availablePickerOptions.map((i) => (
                                <SelectItem key={i.id} value={i.id}>
                                    {i.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button type="button" onClick={addRow} disabled={!pickerItemId}>
                    <Plus className="size-4" />
                    Add
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="w-32">Quantity</TableHead>
                            <TableHead className="w-16">Unit</TableHead>
                            <TableHead className="w-32">Unit Cost</TableHead>
                            <TableHead className="w-28">Subtotal</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => {
                            const rowTotal = (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);

                            return (
                                <TableRow key={row.key}>
                                    <TableCell>
                                        <input type="hidden" name="itemType" value={row.itemType} />
                                        <input type="hidden" name="itemId" value={row.itemId} />
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{row.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {row.itemType === "PRODUCT" ? "Product" : "Ingredient"}
                                            </Badge>
                                        </div>
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
                                    <TableCell className="text-muted-foreground">{row.unit}</TableCell>
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
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                    Use the picker above to add ingredients or products to this purchase.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end">
                <p className="text-sm font-medium">
                    Total: <span className="text-base">Rs. {money(total)}</span>
                </p>
            </div>

            {state.fieldErrors?.items && (
                <p className="text-sm text-destructive">{state.fieldErrors.items[0]}</p>
            )}
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending || rows.length === 0}>
                {pending ? "Saving..." : "Record Purchase"}
            </Button>
        </form>
    );
}