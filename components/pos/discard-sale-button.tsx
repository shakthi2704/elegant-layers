"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { discardSale } from "@/app/(dashboard)/pos/actions";
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

export function DiscardSaleButton({ saleId, label }: { saleId: string; label: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(
        async (_prevState: ActionState) => discardSale(saleId),
        {}
    );

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            router.push("/pos");
        }
    }, [state.success, router]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={<Button variant="outline">Discard Bill</Button>} />
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Discard &quot;{label}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Nothing was ever deducted since this bill was only held, not completed. This
                        just removes it — no reason needed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <form action={formAction}>
                        <Button type="submit" variant="destructive" disabled={pending}>
                            {pending ? "Discarding..." : "Discard"}
                        </Button>
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}