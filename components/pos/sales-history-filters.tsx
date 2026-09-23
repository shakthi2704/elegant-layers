"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function StatusFilterSelect({ defaultValue }: { defaultValue: string }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={defaultValue}>
                <SelectTrigger id="status" className="w-36">
                    <SelectValue placeholder="All">
                        {(value: string) =>
                            value === "COMPLETED"
                                ? "Completed"
                                : value === "VOID"
                                    ? "Void"
                                    : "All"
                        }
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="VOID">Void</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

export function CashierFilterSelect({
    defaultValue,
    cashiers,
}: {
    defaultValue: string;
    cashiers: { id: string; name: string }[];
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor="cashierId">Cashier</Label>
            <Select name="cashierId" defaultValue={defaultValue}>
                <SelectTrigger id="cashierId" className="w-40">
                    <SelectValue placeholder="All">
                        {(value: string) =>
                            cashiers.find((c) => c.id === value)?.name ?? "All"
                        }
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {cashiers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}