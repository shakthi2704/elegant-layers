"use client";

import { useActionState, useEffect, useState } from "react";

import { disposeFixedAsset } from "@/app/(dashboard)/fixed-assets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

export function DisposeAssetButton({ assetId, assetName }: { assetId: string; assetName: string }) {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(disposeFixedAsset.bind(null, assetId), {});

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={<Button variant="outline">Dispose Asset</Button>} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Dispose &quot;{assetName}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This stops depreciation as of the disposal date and locks the asset from
                        further edits. Can&apos;t be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <form action={formAction} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="disposalDate">Disposal Date</Label>
                        <Input
                            id="disposalDate"
                            name="disposalDate"
                            type="date"
                            defaultValue={todayIsoDate()}
                            required
                        />
                        {state.fieldErrors?.disposalDate && (
                            <p className="text-sm text-destructive">{state.fieldErrors.disposalDate[0]}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea id="notes" name="notes" placeholder="e.g. Sold, scrapped, damaged beyond repair" />
                    </div>
                    {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                        <Button type="submit" disabled={pending}>
                            {pending ? "Disposing..." : "Dispose"}
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}