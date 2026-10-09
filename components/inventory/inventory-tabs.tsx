import Link from "next/link";

import { cn } from "@/lib/utils";

export const INVENTORY_VIEWS = [
    { value: "stock", label: "Stock" },
    { value: "movements", label: "Movements" },
    { value: "adjustments", label: "Adjustments" },
] as const;

export type InventoryView = (typeof INVENTORY_VIEWS)[number]["value"];

/** Turns the raw ?view= value into a valid view, defaulting to "stock". */
export function parseInventoryView(value: string | undefined): InventoryView {
    const match = INVENTORY_VIEWS.find((v) => v.value === value);
    return match ? match.value : "stock";
}

export function InventoryTabs({ active }: { active: InventoryView }) {
    return (
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
            {INVENTORY_VIEWS.map((v) => (
                <Link
                    key={v.value}
                    href={`/inventory?view=${v.value}`}
                    className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium",
                        active === v.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {v.label}
                </Link>
            ))}
        </div>
    );
}