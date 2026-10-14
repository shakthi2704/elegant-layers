"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import type { ShopSettingsValues } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ShopSettingsForm({
    action,
    defaults,
}: {
    action: (
        prevState: ActionState,
        formData: FormData
    ) => Promise<ActionState>;
    defaults: ShopSettingsValues;
}) {
    const [state, formAction, pending] = useActionState(action, {});

    // Controlled, so a failed save never wipes what was typed.
    const [name, setName] = useState(defaults.name);
    const [address, setAddress] = useState(defaults.address);
    const [phone, setPhone] = useState(defaults.phone);
    const [billFooter, setBillFooter] = useState(defaults.billFooter);

    return (
        <Card className="max-w-2xl">
            <CardContent>
                <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Business name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Printed at the top of every bill and shown in the
                            menu.
                        </p>
                        {state.fieldErrors?.name && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.name[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            name="address"
                            rows={3}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional. Press Enter to start a new line. Printed
                            under the business name.
                        </p>
                        {state.fieldErrors?.address && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.address[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional. You can enter more than one number.
                        </p>
                        {state.fieldErrors?.phone && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.phone[0]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="billFooter">Message at the bottom of bills</Label>
                        <Input
                            id="billFooter"
                            name="billFooter"
                            value={billFooter}
                            onChange={(e) => setBillFooter(e.target.value)}
                            maxLength={120}
                            placeholder="e.g. Thank you, come again!"
                        />
                        <p className="text-xs text-muted-foreground">
                            Optional. Leave it empty to print no message.
                        </p>
                        {state.fieldErrors?.billFooter && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.billFooter[0]}
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

                    {state.success && (
                        <div
                            role="status"
                            className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600"
                        >
                            Settings saved. New bills will use these details.
                        </div>
                    )}

                    <div className="flex justify-end border-t pt-6">
                        <Button type="submit" disabled={pending}>
                            {pending ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}