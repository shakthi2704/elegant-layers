"use client";

import { useState } from "react";
import { useActionState } from "react";
import { CldUploadWidget } from "next-cloudinary";

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

type Product = { id: string; name: string };

type CakeOrderFormValues = {
    customerName: string;
    customerPhone: string;
    productId: string | null;
    cakeName: string;
    shape: string | null;
    weight: string | null;
    message: string | null;
    imageUrl: string | null;
    pickupDate: string;
    pickupTime: string;
    price: number | string | null;
    advancePaid: number | string | null;
    paymentMethod: string | null;
    notes: string | null;
};

const PAYMENT_METHODS = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_DEPOSIT", label: "Bank Deposit" },
];

export function CakeOrderForm({
    action,
    products,
    defaultValues,
    submitLabel,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    products: Product[];
    defaultValues?: Partial<CakeOrderFormValues>;
    submitLabel: string;
}) {
    const [state, formAction, pending] = useActionState(action, {});
    const [imageUrl, setImageUrl] = useState<string | null>(defaultValues?.imageUrl ?? null);

    return (
        <form
            key={defaultValues ? JSON.stringify(defaultValues) : "new"}
            action={formAction}
            className="max-w-lg space-y-5"
        >
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                        id="customerName"
                        name="customerName"
                        defaultValue={defaultValues?.customerName}
                        required
                    />
                    {state.fieldErrors?.customerName && (
                        <p className="text-sm text-destructive">{state.fieldErrors.customerName[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="customerPhone">Customer Phone</Label>
                    <Input
                        id="customerPhone"
                        name="customerPhone"
                        type="tel"
                        defaultValue={defaultValues?.customerPhone}
                        required
                    />
                    {state.fieldErrors?.customerPhone && (
                        <p className="text-sm text-destructive">{state.fieldErrors.customerPhone[0]}</p>
                    )}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="productId">Tie to an Existing Product (optional)</Label>
                <Select name="productId" defaultValue={defaultValues?.productId ?? "none"}>
                    <SelectTrigger id="productId" className="w-full">
                        <SelectValue placeholder="None — custom cake">
                            {(value: string | null) =>
                                products.find((p) => p.id === value)?.name ?? "None — custom cake"
                            }
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None — custom cake</SelectItem>
                        {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="cakeName">Cake Name / Description</Label>
                <Input
                    id="cakeName"
                    name="cakeName"
                    placeholder="e.g. 2kg Chocolate Fudge, 2-tier"
                    defaultValue={defaultValues?.cakeName}
                    required
                />
                {state.fieldErrors?.cakeName && (
                    <p className="text-sm text-destructive">{state.fieldErrors.cakeName[0]}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="shape">Shape</Label>
                    <Input
                        id="shape"
                        name="shape"
                        placeholder="e.g. Round, Heart"
                        defaultValue={defaultValues?.shape ?? ""}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                        id="weight"
                        name="weight"
                        placeholder="e.g. 1kg, 500g"
                        defaultValue={defaultValues?.weight ?? ""}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="message">Cake Message / Inscription</Label>
                <Input
                    id="message"
                    name="message"
                    placeholder="e.g. Happy Birthday Amaya"
                    defaultValue={defaultValues?.message ?? ""}
                />
            </div>

            <div className="space-y-1.5">
                <Label>Reference Photo</Label>
                <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
                {imageUrl ? (
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt="Cake reference"
                            className="h-20 w-20 rounded-md border object-cover"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => setImageUrl(null)}>
                            Remove
                        </Button>
                    </div>
                ) : (
                    <CldUploadWidget
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        onSuccess={(result) => {
                            const info = result.info;
                            if (info && typeof info === "object" && "secure_url" in info) {
                                setImageUrl(info.secure_url as string);
                            }
                        }}
                    >
                        {({ open }) => (
                            <Button type="button" variant="outline" onClick={() => open()}>
                                Upload Photo
                            </Button>
                        )}
                    </CldUploadWidget>
                )}
                {state.fieldErrors?.imageUrl && (
                    <p className="text-sm text-destructive">{state.fieldErrors.imageUrl[0]}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="pickupDate">Pickup Date</Label>
                    <Input
                        id="pickupDate"
                        name="pickupDate"
                        type="date"
                        defaultValue={defaultValues?.pickupDate}
                        required
                    />
                    {state.fieldErrors?.pickupDate && (
                        <p className="text-sm text-destructive">{state.fieldErrors.pickupDate[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="pickupTime">Pickup Time</Label>
                    <Input
                        id="pickupTime"
                        name="pickupTime"
                        type="time"
                        defaultValue={defaultValues?.pickupTime}
                        required
                    />
                    {state.fieldErrors?.pickupTime && (
                        <p className="text-sm text-destructive">{state.fieldErrors.pickupTime[0]}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="price">Price (Rs.)</Label>
                    <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={defaultValues?.price ?? ""}
                    />
                    {state.fieldErrors?.price && (
                        <p className="text-sm text-destructive">{state.fieldErrors.price[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="advancePaid">Advance Paid (Rs.)</Label>
                    <Input
                        id="advancePaid"
                        name="advancePaid"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={defaultValues?.advancePaid ?? ""}
                    />
                    {state.fieldErrors?.advancePaid && (
                        <p className="text-sm text-destructive">{state.fieldErrors.advancePaid[0]}</p>
                    )}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Advance Payment Method</Label>
                <Select name="paymentMethod" defaultValue={defaultValues?.paymentMethod ?? "none"}>
                    <SelectTrigger id="paymentMethod" className="w-full">
                        <SelectValue placeholder="Not applicable">
                            {(value: string | null) =>
                                PAYMENT_METHODS.find((m) => m.value === value)?.label ?? "Not applicable"
                            }
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Not applicable</SelectItem>
                        {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {state.fieldErrors?.paymentMethod && (
                    <p className="text-sm text-destructive">{state.fieldErrors.paymentMethod[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : submitLabel}
            </Button>
        </form>
    );
}