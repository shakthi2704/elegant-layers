"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { voidExpense } from "@/app/(dashboard)/expenses/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function VoidExpenseButton({
    expenseId,
    expenseLabel,
}: {
    expenseId: string;
    expenseLabel: string;
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(
        voidExpense.bind(null, expenseId),
        {}
    );

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
                render={<Button variant="destructive">Void Expense</Button>}
            />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Void {expenseLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        A voided expense is no longer counted in totals or
                        reports, but it stays in the list for the record. This
                        can&apos;t be undone. To correct a mistake, void it and
                        record a new expense.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form action={formAction} className="space-y-2">
                    <Label htmlFor="void-reason">Reason</Label>
                    <Textarea
                        id="void-reason"
                        name="reason"
                        placeholder="e.g. Entered the wrong amount"
                        required
                    />
                    {state.fieldErrors?.reason && (
                        <p className="text-sm text-destructive">
                            {state.fieldErrors.reason[0]}
                        </p>
                    )}
                    {state.error && (
                        <p className="text-sm text-destructive">{state.error}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={pending}
                        >
                            {pending ? "Voiding..." : "Void"}
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}