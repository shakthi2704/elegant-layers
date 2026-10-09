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
    { value: "ALL", label: "All items" },
    { value: "INGREDIENT", label: "Ingredients" },
    { value: "PRODUCT", label: "Products" },
];

type Defaults = {
    type?: string;
    low?: string;
    q?: string;
};

export function StockFilterBar({ defaults }: { defaults: Defaults }) {
    const type =
        TYPE_OPTIONS.find((o) => o.value === defaults.type)?.value ?? "ALL";

    return (
        <Card className="max-w-full p-4">
            <form method="get" key={JSON.stringify(defaults)}>
                <input type="hidden" name="view" value="stock" />

                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="stock-type">Show</Label>
                        <Select name="type" defaultValue={type}>
                            <SelectTrigger id="stock-type" className="w-full">
                                <SelectValue placeholder="All items">
                                    {(value: string) =>
                                        TYPE_OPTIONS.find((o) => o.value === value)?.label ??
                                        "All items"
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
                        <Label htmlFor="stock-q">Item</Label>
                        <Input
                            id="stock-q"
                            type="text"
                            name="q"
                            placeholder="Search by item name"
                            defaultValue={defaults.q}
                            className="h-9 w-full"
                        />
                    </div>

                    <div className="flex h-9 items-center gap-2">
                        <input
                            id="stock-low"
                            type="checkbox"
                            name="low"
                            value="1"
                            defaultChecked={defaults.low === "1"}
                            className="size-4"
                        />
                        <Label htmlFor="stock-low">Low or out of stock only</Label>
                    </div>

                    <div className="flex h-9 items-center gap-2">
                        <Button type="submit" size="sm">
                            Filter
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/inventory?view=stock" />}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}