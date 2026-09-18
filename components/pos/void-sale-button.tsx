"use client";

import { useActionState, useEffect, useState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { voidSale } from "@/app/(dashboard)/pos/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export function VoidSaleButton({ saleId, saleLabel }: { saleId: string; saleLabel: string }) {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(voidSale.bind(null, saleId), {});

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={<Button variant="destructive">Void Sale</Button>} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Void {saleLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This restores the stock/ingredients this sale used. Can&apos;t be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <form action={formAction} className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea id="reason" name="reason" placeholder="e.g. Rung up by mistake" required />
                    {state.fieldErrors?.reason && (
                        <p className="text-sm text-destructive">{state.fieldErrors.reason[0]}</p>
                    )}
                    {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                        <Button type="submit" variant="destructive" disabled={pending}>
                            {pending ? "Voiding..." : "Void"}
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}