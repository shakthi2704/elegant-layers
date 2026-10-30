"use client";

import { useActionState, useMemo, useState } from "react";


import { completeSale, holdSale } from "@/app/(dashboard)/pos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";


type ProductOption = {
    id: string;
    name: string;
    sellingPrice: number;
    unit: string;
    categoryId: string;
    categoryName: string;
};

type CategoryOption = { id: string; name: string };

type CartLine = {
    productId: string;
    name: string;
    unitPrice: number;
    unit: string;
    quantity: number;
    freeQuantity: number; // how many of the units are given free
};

type ExistingItem = {
    productId: string;
    name: string;
    unitPrice: number;
    unit: string;
    quantity: number;
    isComplimentary: boolean;
};

// A saved bill keeps paid and free units as separate rows; the screen shows
// one line per product, with a count of how many are free.
function groupExistingItems(items: ExistingItem[]): CartLine[] {
    const lines: CartLine[] = [];
    for (const item of items) {
        const found = lines.find((l) => l.productId === item.productId);
        if (found) {
            found.quantity = Math.round((found.quantity + item.quantity) * 1000) / 1000;
            if (item.isComplimentary) {
                found.freeQuantity =
                    Math.round((found.freeQuantity + item.quantity) * 1000) / 1000;
            }
        } else {
            lines.push({
                productId: item.productId,
                name: item.name,
                unitPrice: item.unitPrice,
                unit: item.unit,
                quantity: item.quantity,
                freeQuantity: item.isComplimentary ? item.quantity : 0,
            });
        }
    }
    return lines;
}

export function POSTerminal({
    products,
    categories,
    existingSale,
}: {
    products: ProductOption[];
    categories: CategoryOption[];
    existingSale: {
        id: string;
        type: "DINE_IN" | "TAKEAWAY";
        holdLabel: string | null;
        discount: number;
        complimentaryReason: string | null;
        items: ExistingItem[];
    } | null;
}) {
    const saleId = existingSale?.id ?? null;

    const [activeCategory, setActiveCategory] = useState<string>("ALL");
    const [cart, setCart] = useState<CartLine[]>(
        groupExistingItems(existingSale?.items ?? [])
    );
    const [saleType, setSaleType] = useState<"DINE_IN" | "TAKEAWAY">(
        existingSale?.type ?? "TAKEAWAY"
    );
    const [holdLabel, setHoldLabel] = useState(existingSale?.holdLabel ?? "");
    const [cashReceived, setCashReceived] = useState("");
    const [complimentaryReason, setComplimentaryReason] = useState(
        existingSale?.complimentaryReason ?? ""
    );
    const [discountMode, setDiscountMode] = useState<"AMOUNT" | "PERCENT">(
        "AMOUNT"
    );
    const [discountInput, setDiscountInput] = useState(
        existingSale && existingSale.discount > 0
            ? String(existingSale.discount)
            : ""
    );

    const [holdState, holdFormAction, holdPending] = useActionState(
        holdSale.bind(null, saleId),
        {}
    );
    const [completeState, completeFormAction, completePending] = useActionState(
        completeSale.bind(null, saleId),
        {}
    );

    const visibleProducts = useMemo(
        () =>
            activeCategory === "ALL"
                ? products
                : products.filter((p) => p.categoryId === activeCategory),
        [products, activeCategory]
    );

    // Only the paid units count towards the bill; free units are shown separately.
    const subtotal = cart.reduce(
        (sum, line) => sum + (line.quantity - line.freeQuantity) * line.unitPrice,
        0
    );
    const complimentaryValue = cart.reduce(
        (sum, line) => sum + line.freeQuantity * line.unitPrice,
        0
    );
    const hasFree = cart.some((l) => l.freeQuantity > 0);
    const reasonMissing = hasFree && complimentaryReason.trim().length < 3;

    // The discount is typed as an amount (Rs) or as a percentage of the bill.
    const discountTyped = Number(discountInput) || 0;
    const discountAmount =
        discountMode === "PERCENT"
            ? Math.round(subtotal * discountTyped) / 100
            : Math.round(discountTyped * 100) / 100;
    const discountInvalid =
        discountTyped < 0 ||
        (discountMode === "PERCENT" && discountTyped > 100) ||
        discountAmount > subtotal + 0.005;
    const appliedDiscount = discountInvalid ? 0 : discountAmount;
    const total = subtotal - appliedDiscount;
    const cashReceivedNum = Number(cashReceived) || 0;
    const changeGiven = cashReceivedNum - total;

    function addToCart(product: ProductOption) {
        setCart((prev) => {
            const existing = prev.find((l) => l.productId === product.id);
            if (existing) {
                return prev.map((l) =>
                    l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    unitPrice: product.sellingPrice,
                    unit: product.unit,
                    quantity: 1,
                    freeQuantity: 0,
                },
            ];
        });
    }

    function updateQuantity(productId: string, quantity: number) {
        if (quantity <= 0) {
            setCart((prev) => prev.filter((l) => l.productId !== productId));
            return;
        }
        setCart((prev) =>
            prev.map((l) =>
                l.productId === productId
                    ? { ...l, quantity, freeQuantity: Math.min(l.freeQuantity, quantity) }
                    : l
            )
        );
    }

    function updateFree(productId: string, freeQuantity: number) {
        setCart((prev) =>
            prev.map((l) =>
                l.productId === productId
                    ? { ...l, freeQuantity: Math.max(0, Math.min(freeQuantity, l.quantity)) }
                    : l
            )
        );
    }

    function removeLine(productId: string) {
        setCart((prev) => prev.filter((l) => l.productId !== productId));
    }

    function CartHiddenInputs() {
        return (
            <>
                <input type="hidden" name="type" value={saleType} />
                <input type="hidden" name="billDiscount" value={appliedDiscount.toFixed(2)} />
                <input type="hidden" name="complimentaryReason" value={hasFree ? complimentaryReason : ""} />
                {cart.map((line) => (
                    <span key={line.productId}>
                        <input type="hidden" name="productId" value={line.productId} />
                        <input type="hidden" name="quantity" value={line.quantity} />
                        <input type="hidden" name="unitPrice" value={line.unitPrice} />
                        <input type="hidden" name="freeQuantity" value={line.freeQuantity} />
                        <input type="hidden" name="discount" value="0" />
                    </span>
                ))}
            </>
        );
    }

    return (
        <div className="grid grid-cols-[1fr_360px] gap-6">
            <div className="space-y-4">
                <Card>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={activeCategory === "ALL" ? "default" : "secondary"}
                            onClick={() => setActiveCategory("ALL")}
                        >
                            All
                        </Button>
                        {categories.map((c) => (
                            <Button
                                key={c.id}
                                type="button"
                                size="sm"
                                variant={activeCategory === c.id ? "default" : "secondary"}
                                onClick={() => setActiveCategory(c.id)}
                            >
                                {c.name}
                            </Button>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-3 gap-3 ">
                    {visibleProducts.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => addToCart(p)}
                            className="rounded-lg border border-border py-6 px-4 border- text-left bg-muted/50  hover:bg-muted/50"
                        >
                            <p className="font-semibold text-base">{p.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Rs. {p.sellingPrice.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })} /<span className="text-[10px]"> {p.unit}</span>
                            </p>

                        </button>
                    ))}
                    {visibleProducts.length === 0 && (
                        <p className="col-span-3 py-10 text-center text-sm text-muted-foreground">
                            No products in this category.
                        </p>
                    )}
                </div>
            </div>

            {/* Cart + checkout */}
            <Card>
                <div className="space-y-4 rounded-lg border border-border p-4 border-muted">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={saleType === "TAKEAWAY" ? "default" : "outline"}
                            onClick={() => setSaleType("TAKEAWAY")}
                        >
                            Takeaway
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={saleType === "DINE_IN" ? "default" : "secondary"}
                            onClick={() => setSaleType("DINE_IN")}
                        >
                            Dine-in
                        </Button>
                    </div>

                    <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                        {cart.map((line) => {
                            const paidTotal = (line.quantity - line.freeQuantity) * line.unitPrice;
                            return (
                                <div key={line.productId} className="space-y-1 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="font-medium">{line.name}</p>
                                            <p className="text-muted-foreground text-xs">
                                                Rs. {line.unitPrice.toFixed(2)} / {line.unit}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                className="size-6"
                                                onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                                            >
                                                -
                                            </Button>
                                            <span className="w-8 text-center">{line.quantity}</span>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                className="size-6"
                                                onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                        <p className="w-16 text-right font-medium">
                                            {line.freeQuantity >= line.quantity ? "FREE" : paidTotal.toFixed(2)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => removeLine(line.productId)}
                                            className="text-destructive"
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <span>Complimentary</span>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="size-5"
                                            disabled={line.freeQuantity <= 0}
                                            onClick={() => updateFree(line.productId, line.freeQuantity - 1)}
                                        >
                                            -
                                        </Button>
                                        <span className="w-6 text-center">{line.freeQuantity}</span>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="size-5"
                                            disabled={line.freeQuantity >= line.quantity}
                                            onClick={() => updateFree(line.productId, line.freeQuantity + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                        {cart.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Tap a product to add it to the bill.
                            </p>
                        )}
                    </div>

                    {/* Complimentary */}
                    {hasFree && (
                        <div className="space-y-2 border-t border-border pt-3">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Complimentary items</span>
                                <span>
                                    Rs. {complimentaryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <Label htmlFor="complimentaryReason">Reason for complimentary items</Label>
                            <Input
                                id="complimentaryReason"
                                list="complimentary-reasons"
                                value={complimentaryReason}
                                onChange={(e) => setComplimentaryReason(e.target.value)}
                                maxLength={200}
                                placeholder="e.g. Staff meal"
                            />
                            <datalist id="complimentary-reasons">
                                <option value="Staff meal" />
                                <option value="Customer gift" />
                                <option value="Sample / tasting" />
                                <option value="Owner's order" />
                            </datalist>
                            {reasonMissing && (
                                <p className="text-xs text-muted-foreground">
                                    A reason is needed to charge this bill.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Discount */}
                    <div className="space-y-2 border-t border-border pt-3">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="discountInput">Discount</Label>
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={discountMode === "AMOUNT" ? "default" : "outline"}
                                    className="h-7 px-2"
                                    onClick={() => setDiscountMode("AMOUNT")}
                                >
                                    Rs
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={discountMode === "PERCENT" ? "default" : "outline"}
                                    className="h-7 px-2"
                                    onClick={() => setDiscountMode("PERCENT")}
                                >
                                    %
                                </Button>
                            </div>
                        </div>
                        <Input
                            id="discountInput"
                            type="number"
                            step="0.01"
                            min="0"
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            placeholder={discountMode === "PERCENT" ? "0 %" : "0.00"}
                        />
                        {discountInvalid && (
                            <p className="text-sm text-destructive">
                                {discountMode === "PERCENT" && discountTyped > 100
                                    ? "A discount can't be more than 100%."
                                    : "The discount can't be more than the bill total."}
                            </p>
                        )}
                    </div>

                    {appliedDiscount > 0 && (
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>
                                    Rs. {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between text-destructive">
                                <span>Discount</span>
                                <span>
                                    - Rs. {appliedDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-primary">
                            Rs. {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Hold form */}
                    <form action={holdFormAction} className="space-y-2">
                        <CartHiddenInputs />
                        <div className="space-y-1">
                            <Label htmlFor="holdLabel">Hold label</Label>
                            <Input
                                id="holdLabel"
                                name="holdLabel"
                                value={holdLabel}
                                onChange={(e) => setHoldLabel(e.target.value)}
                                placeholder="e.g. Window table"
                            />
                        </div>
                        {holdState.error && <p className="text-sm text-destructive">{holdState.error}</p>}
                        <Button
                            type="submit"
                            variant="secondary"
                            className="w-full"
                            disabled={cart.length === 0 || holdPending || discountInvalid}
                        >
                            {holdPending ? "Holding..." : "Hold Bill"}
                        </Button>
                    </form>

                    {/* Complete form */}
                    <form action={completeFormAction} className="space-y-2 border-t border-border pt-3">
                        <CartHiddenInputs />
                        <div className="space-y-1">
                            <Label htmlFor="cashReceived">Cash received</Label>
                            <Input
                                id="cashReceived"
                                name="cashReceived"
                                type="number"
                                step="0.01"
                                min="0"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        {cashReceivedNum > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Change: Rs. {changeGiven >= 0 ? changeGiven.toFixed(2) : "0.00"}
                            </p>
                        )}
                        {completeState.error && (
                            <p className="text-sm text-destructive">{completeState.error}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={cart.length === 0 || completePending || discountInvalid || reasonMissing}>
                            {completePending ? "Completing..." : "Charge & Complete"}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}