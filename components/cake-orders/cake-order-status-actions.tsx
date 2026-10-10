"use client";

import { useActionState, useEffect, useState } from "react";

import { advanceCakeOrderStatus, cancelCakeOrder } from "@/app/(dashboard)/cake-orders/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WASTE_REASON_OPTIONS } from "@/lib/validations/inventory-waste";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    advancePaid,
}: {
    orderId: string;
    status: string;
    canCancel: boolean;
    advancePaid: number;
}) {
    const [advanceState, advanceAction, advancePending] = useActionState(
        advanceCakeOrderStatus.bind(null, orderId),
        {}
    );
    const [cancelOpen, setCancelOpen] = useState(false);
    // A Ready cake that is being cancelled is almost always thrown away.
    const [discard, setDiscard] = useState(status === "READY");
    const [discardReason, setDiscardReason] = useState(
        status === "READY" ? "NOT_COLLECTED" : ""
    );
    const [cancelState, cancelAction, cancelPending] = useActionState(
        cancelCakeOrder.bind(null, orderId),
        {}
    );

    useEffect(() => {
        if (cancelState.success) {
            setCancelOpen(false);
        }
    }, [cancelState.success]);

    const [collectOpen, setCollectOpen] = useState(false);

    useEffect(() => {
        if (advanceState.success) {
            setCollectOpen(false);
        }
    }, [advanceState.success]);

    if (status === "COLLECTED" || status === "CANCELLED") {
        return null;
    }

    const nextLabel = NEXT_LABEL[status];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {nextLabel && status !== "READY" && (
                <form action={advanceAction}>
                    <Button type="submit" disabled={advancePending}>
                        {advancePending ? "Updating..." : nextLabel}
                    </Button>
                </form>
            )}

            {status === "READY" && (
                <AlertDialog open={collectOpen} onOpenChange={setCollectOpen}>
                    <AlertDialogTrigger render={<Button>{nextLabel}</Button>} />
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Mark as collected?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Confirm the customer has paid the full balance and taken the
                                cake. The order will be locked and can&apos;t be edited or
                                cancelled afterwards.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <form action={advanceAction}>
                            <AlertDialogFooter>
                                <AlertDialogCancel type="button">Back</AlertDialogCancel>
                                <Button type="submit" disabled={advancePending}>
                                    {advancePending ? "Updating..." : "Confirm Collected"}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>
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

                            {advancePaid > 0 && (
                                <fieldset className="space-y-2">
                                    <legend className="text-sm font-medium">
                                        What happens to the advance of Rs.{" "}
                                        {advancePaid.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                        ?
                                    </legend>
                                    <label className="flex items-start gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="advanceOutcome"
                                            value="REFUNDED"
                                            className="mt-1"
                                        />
                                        <span>
                                            <span className="font-medium">Refunded</span>{" "}
                                            — the money was given back to the customer.
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
                                            shop keeps the money, and it counts as income.
                                        </span>
                                    </label>
                                    {cancelState.fieldErrors?.advanceOutcome && (
                                        <p className="text-sm text-destructive">
                                            {cancelState.fieldErrors.advanceOutcome[0]}
                                        </p>
                                    )}
                                </fieldset>
                            )}
                            {(status === "IN_PROGRESS" || status === "READY") && (
                                <fieldset className="space-y-3 rounded-md border border-border p-3">
                                    <label className="flex items-start gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            name="discardCake"
                                            value="1"
                                            checked={discard}
                                            onChange={(e) => setDiscard(e.target.checked)}
                                            className="mt-1"
                                        />
                                        <span>
                                            <span className="font-medium">
                                                The cake was already made and is being thrown away
                                            </span>
                                            <br />
                                            <span className="text-muted-foreground">
                                                This is recorded as waste in Reports.
                                            </span>
                                        </span>
                                    </label>

                                    {discard && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="discardReason">
                                                Why is it being discarded?
                                            </Label>
                                            <Select
                                                name="discardReason"
                                                value={discardReason}
                                                onValueChange={(value) =>
                                                    setDiscardReason(value ?? "")
                                                }
                                            >
                                                <SelectTrigger id="discardReason" className="w-full">
                                                    <SelectValue placeholder="Choose a reason">
                                                        {(value: string | null) =>
                                                            WASTE_REASON_OPTIONS.find(
                                                                (o) => o.value === value
                                                            )?.label ?? "Choose a reason"
                                                        }
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {WASTE_REASON_OPTIONS.map((o) => (
                                                        <SelectItem key={o.value} value={o.value}>
                                                            {o.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {cancelState.fieldErrors?.discardReason && (
                                                <p className="text-sm text-destructive">
                                                    {cancelState.fieldErrors.discardReason[0]}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </fieldset>
                            )}

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