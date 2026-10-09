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

type Defaults = {
    supplier?: string;
    from?: string;
    to?: string;
};

export function PurchaseFilterBar({
    suppliers,
    defaults,
}: {
    suppliers: { id: string; name: string }[];
    defaults: Defaults;
}) {
    const options = [{ id: "ALL", name: "All suppliers" }, ...suppliers];
    const supplier =
        options.find((o) => o.id === defaults.supplier)?.id ?? "ALL";

    return (
        <Card className="max-w-full p-4">
            <form method="get" key={JSON.stringify(defaults)}>
                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Select name="supplier" defaultValue={supplier}>
                            <SelectTrigger id="supplier" className="w-full">
                                <SelectValue placeholder="All suppliers">
                                    {(value: string) =>
                                        options.find((o) => o.id === value)
                                            ?.name ?? "All suppliers"
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((o) => (
                                    <SelectItem key={o.id} value={o.id}>
                                        {o.name}
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
                            render={<Link href="/purchases" />}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}