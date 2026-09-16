"use client";

import { useActionState, useState } from "react";

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

type Item = { id: string; name: string; unit: string; currentStock: number };

export function AdjustmentForm({
    action,
    ingredients,
    products,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    ingredients: Item[];
    products: Item[];
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const [itemType, setItemType] = useState<"INGREDIENT" | "PRODUCT" | "">("");
    const [itemId, setItemId] = useState("");

    const itemsForType = itemType === "INGREDIENT" ? ingredients : itemType === "PRODUCT" ? products : [];
    const selectedItem = itemsForType.find((i) => i.id === itemId);

    return (
        <form action={formAction} className="max-w-md space-y-5">
            <div className="space-y-1.5">
                <Label htmlFor="itemType">Type</Label>
                <Select
                    name="itemType"
                    value={itemType}
                    onValueChange={(value) => {
                        setItemType((value as "INGREDIENT" | "PRODUCT") ?? "");
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
                        <SelectItem value="INGREDIENT">Ingredient</SelectItem>
                        <SelectItem value="PRODUCT">Product</SelectItem>
                    </SelectContent>
                </Select>
                {state.fieldErrors?.itemType && (
                    <p className="text-sm text-destructive">{state.fieldErrors.itemType[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="itemId">{itemType === "PRODUCT" ? "Product" : "Ingredient"}</Label>
                <Select
                    key={itemType || "none"}
                    name="itemId"
                    value={itemId}
                    onValueChange={(value) => setItemId(value ?? "")}
                    disabled={!itemType}
                >
                    <SelectTrigger id="itemId" className="w-full">
                        <SelectValue placeholder={itemType ? "Select item" : "Choose a type first"}>
                            {(value: string | null) =>
                                itemsForType.find((i) => i.id === value)?.name ??
                                (itemType ? "Select item" : "Choose a type first")
                            }
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {itemsForType.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {itemType ? "No items found" : "Choose a type first"}
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
                    <p className="text-sm text-destructive">{state.fieldErrors.itemId[0]}</p>
                )}
            </div>

            {selectedItem && (
                <p className="text-sm text-muted-foreground">
                    Current stock: <span className="font-medium text-foreground">{selectedItem.currentStock} {selectedItem.unit}</span>
                </p>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="newStock">New stock (the real, correct amount)</Label>
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
                    <p className="text-sm text-destructive">{state.fieldErrors.newStock[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="note">Reason</Label>
                <Textarea
                    id="note"
                    name="note"
                    placeholder="e.g. Recount after mis-entered purchase quantity"
                    required
                />
                {state.fieldErrors?.note && (
                    <p className="text-sm text-destructive">{state.fieldErrors.note[0]}</p>
                )}
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save Adjustment"}
            </Button>
        </form>
    );
}