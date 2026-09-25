"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const LABELS: Record<string, string> = {
    ACTIVE: "Active (Pending/In Progress/Ready)",
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    READY: "Ready",
    COLLECTED: "Collected",
    CANCELLED: "Cancelled",
};

export function CakeOrderStatusFilterSelect({ defaultValue }: { defaultValue: string }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={defaultValue}>
                <SelectTrigger id="status" className="w-72">
                    <SelectValue placeholder="Active">
                        {(value: string) => LABELS[value] ?? "Active"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}