"use client";

import { useActionState, useState } from "react";
import { X, Plus } from "lucide-react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Product = { id: string; name: string; unit: string };

type Row = {
    key: string;
    productId: string;
    quantityProduced: string;
};

let rowKeySeed = 0;
function newRowKey() {
    rowKeySeed += 1;
    return `row-${rowKeySeed}-${Date.now()}`;
}

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

export function ProductionForm({
    action,
    products,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    products: Product[];
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const [rows, setRows] = useState<Row[]>([
        { key: newRowKey(), productId: "", quantityProduced: "" },
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));

    function addRow() {
        setRows((prev) => [...prev, { key: newRowKey(), productId: "", quantityProduced: "" }]);
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
                    <Label htmlFor="productionDate">Production Date</Label>
                    <Input
                        id="productionDate"
                        name="productionDate"
                        type="date"
                        defaultValue={todayIsoDate()}
                        required
                    />
                    {state.fieldErrors?.productionDate && (
                        <p className="text-sm text-destructive">{state.fieldErrors.productionDate[0]}</p>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="w-32">Quantity Produced</TableHead>
                            <TableHead className="w-16">Unit</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => {
                            const selectedProduct = productById.get(row.productId);

                            return (
                                <TableRow key={row.key}>
                                    <TableCell>
                                        <Select
                                            name="productId"
                                            value={row.productId}
                                            onValueChange={(value) => updateRow(row.key, { productId: value ?? "" })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select product">
                                                    {(value: string | null) =>
                                                        products.find((p) => p.id === value)?.name ?? "Select product"
                                                    }
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.length === 0 && (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        No products with a recipe yet
                                                    </div>
                                                )}
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            name="quantityProduced"
                                            type="number"
                                            step="0.001"
                                            min="0.001"
                                            placeholder="0.000"
                                            value={row.quantityProduced}
                                            onChange={(e) => updateRow(row.key, { quantityProduced: e.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {selectedProduct?.unit ?? "—"}
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
                Add Product
            </Button>

            <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" name="notes" placeholder="e.g. extra batch for weekend rush" />
            </div>

            {state.fieldErrors?.items && (
                <p className="text-sm text-destructive">{state.fieldErrors.items[0]}</p>
            )}
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Record Production"}
            </Button>
        </form>
    );
}