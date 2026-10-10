"use client";

import Link from "next/link";

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

const TYPE_OPTIONS = [
    { value: "ALL", label: "All types" },
    { value: "PURCHASE", label: "Purchase" },
    { value: "PRODUCTION_IN", label: "Production (made)" },
    { value: "PRODUCTION_OUT", label: "Production (used)" },
    { value: "SALE", label: "Sale" },
    { value: "SALE_VOID", label: "Sale void" },
    { value: "WASTE", label: "Waste" },
    { value: "ADJUSTMENT", label: "Adjustment" },
];

type Defaults = {
    type?: string;
    from?: string;
    to?: string;
    q?: string;
};

export function MovementFilterBar({ defaults }: { defaults: Defaults }) {
    const type =
        TYPE_OPTIONS.find((o) => o.value === defaults.type)?.value ?? "ALL";

    return (
        <Card className="max-w-full p-4">
            <form method="get" key={JSON.stringify(defaults)}>
                <input type="hidden" name="view" value="movements" />

                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" defaultValue={type}>
                            <SelectTrigger id="type" className="w-full">
                                <SelectValue placeholder="All types">
                                    {(value: string) =>
                                        TYPE_OPTIONS.find((o) => o.value === value)?.label ??
                                        "All types"
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {TYPE_OPTIONS.map((o) => (
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

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="q">Item</Label>
                        <Input
                            id="q"
                            type="text"
                            name="q"
                            placeholder="Search by item name"
                            defaultValue={defaults.q}
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
                            render={<Link href="/inventory?view=movements" />}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}