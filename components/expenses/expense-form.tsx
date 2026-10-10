"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { colomboToday } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/validations/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PAYMENT_OPTIONS = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_DEPOSIT", label: "Bank" },
];

export function ExpenseForm({
    action,
}: {
    action: (
        prevState: ActionState,
        formData: FormData
    ) => Promise<ActionState>;
}) {
    const [state, formAction, pending] = useActionState(action, {});
    const today = colomboToday();

    return (
        <Card className="max-w-2xl">
            <CardContent>
                <form action={formAction} className="space-y-6">
                    {/* Date + Amount */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={today}
                                max={today}
                                required
                            />
                            {state.fieldErrors?.date && (
                                <p className="text-sm text-destructive">
                                    {state.fieldErrors.date[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (Rs.)</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                            />
                            {state.fieldErrors?.amount && (
                                <p className="text-sm text-destructive">
                                    {state.fieldErrors.amount[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Category + Payment method */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category">
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Choose a category">
                                        {(value: string) =>
                                            EXPENSE_CATEGORIES.find(
                                                (c) => c === value
                                            ) ?? "Choose a category"
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {EXPENSE_CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {state.fieldErrors?.category && (
                                <p className="text-sm text-destructive">
                                    {state.fieldErrors.category[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Paid by</Label>
                            <Select name="paymentMethod" defaultValue="CASH">
                                <SelectTrigger
                                    id="paymentMethod"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Cash">
                                        {(value: string) =>
                                            PAYMENT_OPTIONS.find(
                                                (o) => o.value === value
                                            )?.label ?? "Cash"
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_OPTIONS.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {state.fieldErrors?.paymentMethod && (
                                <p className="text-sm text-destructive">
                                    {state.fieldErrors.paymentMethod[0]}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="e.g. September electricity bill"
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional, but required when the category is
                            &quot;Other&quot;.
                        </p>
                        {state.fieldErrors?.description && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.description[0]}
                            </p>
                        )}
                    </div>

                    {state.error && (
                        <div
                            role="alert"
                            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            {state.error}
                        </div>
                    )}

                    <div className="flex justify-end border-t pt-6">
                        <Button type="submit" disabled={pending}>
                            {pending ? "Saving..." : "Record Expense"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}