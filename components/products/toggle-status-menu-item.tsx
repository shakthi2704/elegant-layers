"use client";

import { useTransition } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toggleProductStatus } from "@/app/(dashboard)/products/actions";

export function ToggleStatusMenuItem({
    productId,
    status,
}: {
    productId: string;
    status: "ACTIVE" | "INACTIVE";
}) {
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            await toggleProductStatus(productId);
        });
    }

    return (
        <DropdownMenuItem disabled={isPending} onClick={handleClick}>
            {isPending ? "Updating..." : status === "ACTIVE" ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
    );
}