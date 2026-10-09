"use client";

import Link from "next/link";

import { EXPENSE_CATEGORIES } from "@/lib/validations/expense";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const CATEGORY_OPTIONS = [
    { value: "ALL", label: "All categories" },
    ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const STATUS_OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "VOID", label: "Void" },
];

type Defaults = {
    category?: string;
    status?: string;
    from?: string;
    to?: string;
};

export function ExpenseFilterBar({ defaults }: { defaults: Defaults }) {
    const category =
        CATEGORY_OPTIONS.find((o) => o.value === defaults.category)?.value ??
        "ALL";
    const status =
        STATUS_OPTIONS.find((o) => o.value === defaults.status)?.value ?? "ALL";

    return (
        <Card className="max-w-full p-4">
            <form method="get" key={JSON.stringify(defaults)}>
                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" defaultValue={category}>
                            <SelectTrigger id="category" className="w-full">
                                <SelectValue placeholder="All categories">
                                    {(value: string) =>
                                        CATEGORY_OPTIONS.find(
                                            (o) => o.value === value
                                        )?.label ?? "All categories"
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORY_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" defaultValue={status}>
                            <SelectTrigger id="status" className="w-full">
                                <SelectValue placeholder="All">
                                    {(value: string) =>
                                        STATUS_OPTIONS.find(
                                            (o) => o.value === value
                                        )?.label ?? "All"
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="from">From</Label>
                        <Input
                            id="from"
                            type="date"
                            name="from"
                            defaultValue={defaults.from}
                            className="h-9 w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="to">To</Label>
                        <Input
                            id="to"
                            type="date"
                            name="to"
                            defaultValue={defaults.to}
                            className="h-9 w-full"
                        />
                    </div>

                    <div className="flex h-9 items-center gap-2">
                        <Button type="submit" size="sm">
                            Filter
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/expenses" />}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}