"use client";

import { useTransition } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toggleUserActive } from "@/app/(dashboard)/users/actions";

type ToggleActiveMenuItemProps = {
    userId: string;
    isActive: boolean;
};

export function ToggleActiveMenuItem({
    userId,
    isActive,
}: ToggleActiveMenuItemProps) {
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            await toggleUserActive(userId);
        });
    }

    return (
        <DropdownMenuItem
            disabled={isPending}
            onClick={handleClick}
        >
            {isPending
                ? "Updating..."
                : isActive
                    ? "Deactivate"
                    : "Activate"}
        </DropdownMenuItem>
    );
}
