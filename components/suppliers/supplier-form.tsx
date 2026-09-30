"use client";

import { useActionState } from "react";

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

export function SupplierForm({
    action,
    defaultValues,
    submitLabel,
}: {
    action: (
        prevState: ActionState,
        formData: FormData
    ) => Promise<ActionState>;
    defaultValues?: {
        name: string;
        contact: string | null;
        address: string | null;
    };
    submitLabel: string;
}) {
    const [state, formAction, pending] = useActionState(action, {});

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>
                    {defaultValues
                        ? "Edit supplier"
                        : "Create supplier"}
                </CardTitle>

                <CardDescription>
                    {defaultValues
                        ? "Update this supplier's information."
                        : "Add a new supplier to your shop."}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form
                    action={formAction}
                    className="space-y-6"
                >
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>

                        <Input
                            id="name"
                            name="name"
                            defaultValue={defaultValues?.name}
                            placeholder="Enter supplier name"
                            required
                        />

                        {state.fieldErrors?.name && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.name[0]}
                            </p>
                        )}
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                        <Label htmlFor="contact">
                            Contact
                        </Label>

                        <Input
                            id="contact"
                            name="contact"
                            placeholder="Phone number, WhatsApp, or email"
                            defaultValue={
                                defaultValues?.contact ?? ""
                            }
                        />

                        {state.fieldErrors?.contact && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.contact[0]}
                            </p>
                        )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">
                            Address
                        </Label>

                        <Input
                            id="address"
                            name="address"
                            placeholder="Optional"
                            defaultValue={
                                defaultValues?.address ?? ""
                            }
                        />

                        {state.fieldErrors?.address && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.address[0]}
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
                    <div className="flex items-center justify-end border-t pt-6">
                        <Button
                            type="submit"
                            disabled={pending}
                        >
                            {pending
                                ? "Saving..."
                                : submitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
