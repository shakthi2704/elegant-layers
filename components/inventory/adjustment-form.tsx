"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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

type Item = {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
};

export function AdjustmentForm({
    action,
    ingredients,
    products,
}: {
    action: (
        prevState: ActionState,
        formData: FormData
    ) => Promise<ActionState>;
    ingredients: Item[];
    products: Item[];
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const [itemType, setItemType] = useState<
        "INGREDIENT" | "PRODUCT" | ""
    >("");
    const [itemId, setItemId] = useState("");

    const itemsForType =
        itemType === "INGREDIENT"
            ? ingredients
            : itemType === "PRODUCT"
                ? products
                : [];

    const selectedItem = itemsForType.find((i) => i.id === itemId);

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Inventory adjustment</CardTitle>
                <CardDescription>
                    Correct the actual stock quantity after a recount or
                    to fix a previous mistake.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form action={formAction} className="space-y-6">
                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="itemType">Type</Label>

                        <Select
                            name="itemType"
                            value={itemType}
                            onValueChange={(value) => {
                                setItemType(
                                    (value as
                                        | "INGREDIENT"
                                        | "PRODUCT") ?? ""
                                );
                                setItemId("");
                            }}
                        >
                            <SelectTrigger
                                id="itemType"
                                className="w-full"
                            >
                                <SelectValue placeholder="Select type">
                                    {(value: string | null) =>
                                        value === "INGREDIENT"
                                            ? "Ingredient"
                                            : value === "PRODUCT"
                                                ? "Product"
                                                : "Select type"
                                    }
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="INGREDIENT">
                                    Ingredient
                                </SelectItem>
                                <SelectItem value="PRODUCT">
                                    Product
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {state.fieldErrors?.itemType && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.itemType[0]}
                            </p>
                        )}
                    </div>

                    {/* Item */}
                    <div className="space-y-2">
                        <Label htmlFor="itemId">
                            {itemType === "PRODUCT"
                                ? "Product"
                                : "Ingredient"}
                        </Label>

                        <Select
                            key={itemType || "none"}
                            name="itemId"
                            value={itemId}
                            onValueChange={(value) =>
                                setItemId(value ?? "")
                            }
                            disabled={!itemType}
                        >
                            <SelectTrigger
                                id="itemId"
                                className="w-full"
                            >
                                <SelectValue
                                    placeholder={
                                        itemType
                                            ? "Select item"
                                            : "Choose a type first"
                                    }
                                >
                                    {(value: string | null) =>
                                        itemsForType.find(
                                            (i) => i.id === value
                                        )?.name ??
                                        (itemType
                                            ? "Select item"
                                            : "Choose a type first")
                                    }
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                {itemsForType.length === 0 && (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        {itemType
                                            ? "No items found"
                                            : "Choose a type first"}
                                    </div>
                                )}

                                {itemsForType.map((i) => (
                                    <SelectItem
                                        key={i.id}
                                        value={i.id}
                                    >
                                        {i.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {state.fieldErrors?.itemId && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.itemId[0]}
                            </p>
                        )}
                    </div>

                    {/* Current stock */}
                    {selectedItem && (
                        <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Current stock
                            </p>
                            <p className="mt-1 font-medium">
                                {selectedItem.currentStock}{" "}
                                {selectedItem.unit}
                            </p>
                        </div>
                    )}

                    {/* New stock */}
                    <div className="space-y-2">
                        <Label htmlFor="newStock">
                            New stock (the real, correct amount)
                        </Label>

                        <Input
                            id="newStock"
                            name="newStock"
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.000"
                            required
                        />

                        {state.fieldErrors?.newStock && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.newStock[0]}
                            </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="note">Reason</Label>

                        <Textarea
                            id="note"
                            name="note"
                            placeholder="e.g. Recount after mis-entered purchase quantity"
                            required
                        />

                        {state.fieldErrors?.note && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.note[0]}
                            </p>
                        )}
                    </div>

                    {/* General error */}
                    {state.error && (
                        <div
                            role="alert"
                            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            {state.error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 border-t pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={pending}>
                            {pending
                                ? "Saving..."
                                : "Save Adjustment"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
