"use client";

import { useActionState, useEffect, useState } from "react";

import { resetUserPassword } from "@/app/(dashboard)/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ResetPasswordButton({
    userId,
    userName,
}: {
    userId: string;
    userName: string;
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(
        resetUserPassword.bind(null, userId),
        {}
    );

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    return (
        <div className="space-y-2">
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger
                    render={<Button variant="outline">Reset password</Button>}
                />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Reset password for {userName}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Choose a new password and give it to {userName}{" "}
                            yourself. They will be signed out everywhere and
                            must sign in again with the new password.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />
                            {state.fieldErrors?.newPassword && (
                                <p className="text-sm text-destructive">
                                    {state.fieldErrors.newPassword[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirm new password
                            </Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                            />
                            {state.fieldErrors?.confirmPassword && (
                                <p className="text-sm text-destructive">
                                    {state.fieldErrors.confirmPassword[0]}
                                </p>
                            )}
                        </div>

                        {state.error && (
                            <p className="text-sm text-destructive">
                                {state.error}
                            </p>
                        )}

                        <AlertDialogFooter>
                            <AlertDialogCancel type="button">
                                Cancel
                            </AlertDialogCancel>
                            <Button type="submit" disabled={pending}>
                                {pending ? "Saving..." : "Set new password"}
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>

            {state.success && (
                <p className="text-sm text-green-600 dark:text-green-400">
                    Password updated for {userName}.
                </p>
            )}
        </div>
    );
}