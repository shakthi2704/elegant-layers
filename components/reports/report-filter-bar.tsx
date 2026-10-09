"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReportFilterBar({
    view,
    from,
    to,
}: {
    view: string;
    from: string;
    to: string;
}) {
    const clearHref = view === "summary" ? "/reports" : `/reports?view=${view}`;

    return (
        <Card className="max-w-full p-4">
            <form method="get" key={JSON.stringify({ view, from, to })}>
                <input type="hidden" name="view" value={view} />

                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="from">From</Label>
                        <Input
                            id="from"
                            type="date"
                            name="from"
                            defaultValue={from}
                            className="h-9 w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="to">To</Label>
                        <Input
                            id="to"
                            type="date"
                            name="to"
                            defaultValue={to}
                            className="h-9 w-full"
                        />
                    </div>

                    <div className="flex h-9 items-center gap-2">
                        <Button type="submit" size="sm">
                            Show report
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={clearHref} />}
                        >
                            This month
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}