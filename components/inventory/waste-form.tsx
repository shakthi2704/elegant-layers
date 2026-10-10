"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { WASTE_REASON_OPTIONS } from "@/lib/validations/inventory-waste";
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

export function WasteForm({
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
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");

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
                <CardTitle>Record waste</CardTitle>
                <CardDescription>
                    Use this when stock is thrown away, for example cakes that
                    expired or were never collected. It reduces the stock
                    and is logged with a reason.
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
                                    (value as "INGREDIENT" | "PRODUCT") ?? ""
                                );
                                setItemId("");
                            }}
                        >
                            <SelectTrigger id="itemType" className="w-full">
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
                                <SelectItem value="PRODUCT">Product</SelectItem>
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
                            {itemType === "PRODUCT" ? "Product" : "Ingredient"}
                        </Label>

                        <Select
                            key={itemType || "none"}
                            name="itemId"
                            value={itemId}
                            onValueChange={(value) => setItemId(value ?? "")}
                            disabled={!itemType}
                        >
                            <SelectTrigger id="itemId" className="w-full">
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
                                    <SelectItem key={i.id} value={i.id}>
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
                                {selectedItem.currentStock} {selectedItem.unit}
                            </p>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">
                            Quantity thrown away
                            {selectedItem ? ` (${selectedItem.unit})` : ""}
                        </Label>

                        <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />

                        {state.fieldErrors?.quantity && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.quantity[0]}
                            </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>

                        <Select
                            name="reason"
                            value={reason}
                            onValueChange={(value) => setReason(value ?? "")}
                        >
                            <SelectTrigger id="reason" className="w-full">
                                <SelectValue placeholder="Choose a reason">
                                    {(value: string | null) =>
                                        WASTE_REASON_OPTIONS.find(
                                            (o) => o.value === value
                                        )?.label ?? "Choose a reason"
                                    }
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                {WASTE_REASON_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {state.fieldErrors?.reason && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.reason[0]}
                            </p>
                        )}
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>

                        <Textarea
                            id="note"
                            name="note"
                            placeholder="e.g. Chocolate cake from Tuesday, past its date"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />

                        <p className="text-xs text-muted-foreground">
                            Optional, but required when the reason is
                            &quot;Other&quot;.
                        </p>

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
                            {pending ? "Saving..." : "Record Waste"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}