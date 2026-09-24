"use client";

import { useState, useTransition } from "react";

import { toggleUserActive } from "@/app/(dashboard)/users/actions";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="flex flex-col items-end gap-1">
            <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                    startTransition(async () => {
                        const result = await toggleUserActive(userId);
                        setError(result.error ?? null);
                    })
                }
            >
                {isActive ? "Deactivate" : "Activate"}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}