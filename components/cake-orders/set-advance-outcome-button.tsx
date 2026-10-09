"use client";

import { useActionState, useEffect, useState } from "react";

import { setAdvanceOutcome } from "@/app/(dashboard)/cake-orders/actions";
import { Button } from "@/components/ui/button";
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

export function SetAdvanceOutcomeButton({
    orderId,
    advancePaid,
}: {
    orderId: string;
    advancePaid: number;
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(
        setAdvanceOutcome.bind(null, orderId),
        {}
    );

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
                render={<Button variant="outline">Set advance outcome</Button>}
            />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        What happened to the advance?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This order was cancelled with an advance of Rs.{" "}
                        {advancePaid.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                        . Record whether it was kept or given back. This can
                        only be recorded once and can&apos;t be changed
                        afterwards.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form action={formAction} className="space-y-3">
                    <fieldset className="space-y-2">
                        <label className="flex items-start gap-2 text-sm">
                            <input
                                type="radio"
                                name="advanceOutcome"
                                value="REFUNDED"
                                className="mt-1"
                            />
                            <span>
                                <span className="font-medium">Refunded</span> —
                                the money was given back to the customer.
                            </span>
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                            <input
                                type="radio"
                                name="advanceOutcome"
                                value="KEPT"
                                className="mt-1"
                            />
                            <span>
                                <span className="font-medium">Kept</span> — the
                                shop keeps the money, and it counts as income
                                from today.
                            </span>
                        </label>
                        {state.fieldErrors?.advanceOutcome && (
                            <p className="text-sm text-destructive">
                                {state.fieldErrors.advanceOutcome[0]}
                            </p>
                        )}
                    </fieldset>

                    {state.error && (
                        <p className="text-sm text-destructive">{state.error}</p>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Back</AlertDialogCancel>
                        <Button type="submit" disabled={pending}>
                            {pending ? "Saving..." : "Save outcome"}
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}