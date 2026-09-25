"use client";

import { useActionState, useEffect, useState } from "react";

import { advanceCakeOrderStatus, cancelCakeOrder } from "@/app/(dashboard)/cake-orders/actions";
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

const NEXT_LABEL: Record<string, string> = {
    PENDING: "Mark In Progress",
    IN_PROGRESS: "Mark Ready",
    READY: "Mark Collected",
};

export function CakeOrderStatusActions({
    orderId,
    status,
    canCancel,
}: {
    orderId: string;
    status: string;
    canCancel: boolean;
}) {
    const [advanceState, advanceAction, advancePending] = useActionState(
        advanceCakeOrderStatus.bind(null, orderId),
        {}
    );
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelState, cancelAction, cancelPending] = useActionState(
        cancelCakeOrder.bind(null, orderId),
        {}
    );

    useEffect(() => {
        if (cancelState.success) {
            setCancelOpen(false);
        }
    }, [cancelState.success]);

    if (status === "COLLECTED" || status === "CANCELLED") {
        return null;
    }

    const nextLabel = NEXT_LABEL[status];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {nextLabel && (
                <form action={advanceAction}>
                    <Button type="submit" disabled={advancePending}>
                        {advancePending ? "Updating..." : nextLabel}
                    </Button>
                </form>
            )}
            {advanceState.error && <p className="text-sm text-destructive">{advanceState.error}</p>}

            {canCancel && (
                <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                    <AlertDialogTrigger render={<Button variant="outline">Cancel Order</Button>} />
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This can&apos;t be undone. A reason is required.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <form action={cancelAction} className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="reason">Reason</Label>
                                <Textarea id="reason" name="reason" required />
                                {cancelState.fieldErrors?.reason && (
                                    <p className="text-sm text-destructive">
                                        {cancelState.fieldErrors.reason[0]}
                                    </p>
                                )}
                            </div>
                            {cancelState.error && (
                                <p className="text-sm text-destructive">{cancelState.error}</p>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel type="button">Back</AlertDialogCancel>
                                <Button type="submit" disabled={cancelPending}>
                                    {cancelPending ? "Cancelling..." : "Cancel Order"}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}