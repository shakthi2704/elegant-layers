"use client";

import { useActionState, useMemo, useState } from "react";


import { completeSale, holdSale } from "@/app/(dashboard)/pos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
};

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
        items: { productId: string; name: string; unitPrice: number; unit: string; quantity: number }[];
    } | null;
}) {
    const saleId = existingSale?.id ?? null;

    const [activeCategory, setActiveCategory] = useState<string>("ALL");
    const [cart, setCart] = useState<CartLine[]>(existingSale?.items ?? []);
    const [saleType, setSaleType] = useState<"DINE_IN" | "TAKEAWAY">(
        existingSale?.type ?? "TAKEAWAY"
    );
    const [holdLabel, setHoldLabel] = useState(existingSale?.holdLabel ?? "");
    const [cashReceived, setCashReceived] = useState("");

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

    const total = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
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
            prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
        );
    }

    function removeLine(productId: string) {
        setCart((prev) => prev.filter((l) => l.productId !== productId));
    }

    function CartHiddenInputs() {
        return (
            <>
                <input type="hidden" name="type" value={saleType} />
                {cart.map((line) => (
                    <span key={line.productId}>
                        <input type="hidden" name="productId" value={line.productId} />
                        <input type="hidden" name="quantity" value={line.quantity} />
                        <input type="hidden" name="unitPrice" value={line.unitPrice} />
                        <input type="hidden" name="discount" value="0" />
                    </span>
                ))}
            </>
        );
    }

    return (
        <div className="grid grid-cols-[1fr_360px] gap-6">
            {/* Product picker */}
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={activeCategory === "ALL" ? "default" : "outline"}
                        onClick={() => setActiveCategory("ALL")}
                    >
                        All
                    </Button>
                    {categories.map((c) => (
                        <Button
                            key={c.id}
                            type="button"
                            size="sm"
                            variant={activeCategory === c.id ? "default" : "outline"}
                            onClick={() => setActiveCategory(c.id)}
                        >
                            {c.name}
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {visibleProducts.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => addToCart(p)}
                            className="rounded-lg border border-border p-3 text-left hover:bg-muted/50"
                        >
                            <p className="font-medium">{p.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Rs. {p.sellingPrice.toFixed(2)} / {p.unit}
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
            <div className="space-y-4 rounded-lg border border-border p-4">
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
                        variant={saleType === "DINE_IN" ? "default" : "outline"}
                        onClick={() => setSaleType("DINE_IN")}
                    >
                        Dine-in
                    </Button>
                </div>

                <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                    {cart.map((line) => (
                        <div key={line.productId} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex-1">
                                <p className="font-medium">{line.name}</p>
                                <p className="text-muted-foreground">
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
                                {(line.quantity * line.unitPrice).toFixed(2)}
                            </p>
                            <button
                                type="button"
                                onClick={() => removeLine(line.productId)}
                                className="text-destructive"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Tap a product to add it to the bill.
                        </p>
                    )}
                </div>

                <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                    <span>Total</span>
                    <span>Rs. {total.toFixed(2)}</span>
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
                        variant="outline"
                        className="w-full"
                        disabled={cart.length === 0 || holdPending}
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
                    <Button type="submit" className="w-full" disabled={cart.length === 0 || completePending}>
                        {completePending ? "Completing..." : "Charge & Complete"}
                    </Button>
                </form>
            </div>
        </div>
    );
}