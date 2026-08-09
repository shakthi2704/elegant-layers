"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SupplierForm({
    action,
    defaultValues,
    submitLabel,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    defaultValues?: { name: string; contact: string | null; address: string | null };
    submitLabel: string;
}) {
    const [state, formAction, pending] = useActionState(action, {});

    return (
        <form action={formAction} className="max-w-md space-y-5">
            <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={defaultValues?.name} required />
                {state.fieldErrors?.name && (
                    <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="contact">Contact</Label>
                <Input
                    id="contact"
                    name="contact"
                    placeholder="Phone number, WhatsApp, or email"
                    defaultValue={defaultValues?.contact ?? ""}
                />
                {state.fieldErrors?.contact && (
                    <p className="text-sm text-destructive">{state.fieldErrors.contact[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    name="address"
                    placeholder="Optional"
                    defaultValue={defaultValues?.address ?? ""}
                />
                {state.fieldErrors?.address && (
                    <p className="text-sm text-destructive">{state.fieldErrors.address[0]}</p>
                )}
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : submitLabel}
            </Button>
        </form>
    );
}