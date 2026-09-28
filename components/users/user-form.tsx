"use client";

import { useActionState } from "react";
import Link from "next/link";

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
    action: (
        prevState: ActionState,
        formData: FormData
    ) => Promise<ActionState>;
    mode: "create" | "edit";
    defaultValues?: {
        name: string;
        role: "ADMIN" | "CASHIER";
    };
    submitLabel: string;
}) {
    const [state, formAction, pending] = useActionState(action, {});

    const isCreate = mode === "create";

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>
                    {isCreate ? "Create user" : "Edit user"}
                </CardTitle>
                <CardDescription>
                    {isCreate
                        ? "Create a new user and assign their role."
                        : "Update this user's information and role."}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form
                    key={defaultValues ? JSON.stringify(defaultValues) : "new"}
                    action={formAction}
                    className="space-y-6"
                >
                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>

                        <Select
                            name="role"
                            defaultValue={
                                defaultValues?.role ?? "CASHIER"
                            }
                        >
                            <SelectTrigger id="role" className="w-full">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="ADMIN">
                                    Admin
                                </SelectItem>
                                <SelectItem value="CASHIER">
                                    Cashier
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>

                        <Input
                            id="name"
                            name="name"
                            defaultValue={defaultValues?.name}
                            placeholder="Enter user's name"
                            required
                        />

                        {state.fieldErrors?.name && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.name[0]}
                            </p>
                        )}
                    </div>

                    {/* Create-only fields */}
                    {isCreate && (
                        <div className="space-y-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>

                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    required
                                />

                                {state.fieldErrors?.email && (
                                    <p className="text-sm text-destructive">
                                        {state.fieldErrors.email[0]}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Initial password
                                </Label>

                                <Input
                                    id="password"
                                    name="password"
                                    type="text"
                                    placeholder="Enter initial password"
                                    required
                                />

                                <p className="text-xs text-muted-foreground">
                                    Share this password with the user
                                    directly. There is currently no
                                    self-service password reset.
                                </p>

                                {state.fieldErrors?.password && (
                                    <p className="text-sm text-destructive">
                                        {state.fieldErrors.password[0]}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* General error */}
                    {state.error && (
                        <div
                            role="alert"
                            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            {state.error}
                        </div>
                    )}

                    {/* Success */}
                    {state.success && (
                        <div
                            role="status"
                            className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
                        >
                            User saved successfully.
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 border-t pt-6">
                        <Button
                            nativeButton={false}
                            variant="outline"
                            render={<Link href="/users" />}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={pending}>
                            {pending ? "Saving..." : submitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
