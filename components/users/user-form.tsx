"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function UserForm({
    action,
    mode,
    defaultValues,
    submitLabel,
}: {
    action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    mode: "create" | "edit";
    defaultValues?: { name: string; role: "ADMIN" | "CASHIER" };
    submitLabel: string;
}) {
    const [state, formAction, pending] = useActionState(action, {});

    return (
        <form
            key={defaultValues ? JSON.stringify(defaultValues) : "new"}
            action={formAction}
            className="max-w-md space-y-5"
        >
            <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={defaultValues?.name} required />
                {state.fieldErrors?.name && (
                    <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
                )}
            </div>

            {mode === "create" && (
                <>
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                        {state.fieldErrors?.email && (
                            <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="password">Initial Password</Label>
                        <Input id="password" name="password" type="text" required />
                        <p className="text-xs text-muted-foreground">
                            Share this with them directly — there&apos;s no self-service password
                            reset yet.
                        </p>
                        {state.fieldErrors?.password && (
                            <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
                        )}
                    </div>
                </>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={defaultValues?.role ?? "CASHIER"}>
                    <SelectTrigger id="role">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="CASHIER">Cashier</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state.success && <p className="text-sm text-muted-foreground">Saved.</p>}

            <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : submitLabel}
            </Button>
        </form>
    );
}