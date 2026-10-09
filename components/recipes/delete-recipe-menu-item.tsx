"use client";

import { useActionState, useEffect, useState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DeleteRecipeMenuItem({
    recipeName,
    action,
}: {
    recipeName: string;
    action: () => Promise<ActionState>;
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(
        async (_prevState: ActionState) => action(),
        {}
    );

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    return (
        <>
            <DropdownMenuItem
                variant="destructive"
                closeOnClick={false}
                onClick={() => setOpen(true)}
            >
                Delete
            </DropdownMenuItem>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete &quot;{recipeName}&quot;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This can&apos;t be undone. This only works if the
                            recipe component isn&apos;t currently used by any
                            product.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {state.error && (
                        <p className="text-sm text-destructive">{state.error}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form action={formAction}>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={pending}
                            >
                                {pending ? "Deleting..." : "Delete"}
                            </Button>
                        </form>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}