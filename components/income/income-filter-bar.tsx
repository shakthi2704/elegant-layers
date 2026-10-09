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

const SOURCE_OPTIONS = [
    { value: "ALL", label: "All sources" },
    { value: "POS", label: "POS bills" },
    { value: "CAKE_ADVANCE", label: "Cake order advances" },
    { value: "CAKE_BALANCE", label: "Cake order balances" },
];

type Defaults = {
    source?: string;
    from?: string;
    to?: string;
};

export function IncomeFilterBar({ defaults }: { defaults: Defaults }) {
    const source =
        SOURCE_OPTIONS.find((o) => o.value === defaults.source)?.value ?? "ALL";

    return (
        <Card className="max-w-full p-4">
            <form method="get" key={JSON.stringify(defaults)}>
                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="source">Source</Label>
                        <Select name="source" defaultValue={source}>
                            <SelectTrigger id="source" className="w-full">
                                <SelectValue placeholder="All sources">
                                    {(value: string) =>
                                        SOURCE_OPTIONS.find(
                                            (o) => o.value === value
                                        )?.label ?? "All sources"
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {SOURCE_OPTIONS.map((o) => (
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
                            render={<Link href="/income" />}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}