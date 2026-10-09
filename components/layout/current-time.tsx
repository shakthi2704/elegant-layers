"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const TIMEZONE = "Asia/Colombo";

const dateFormat = new Intl.DateTimeFormat("en-LK", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-LK", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

export function CurrentTime() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        const tick = () => setNow(new Date());

        tick();

        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, []);

    // Render nothing until mounted so server and browser output can't mismatch.
    if (!now) {
        return <div className="h-10" />;
    }

    return (
        <Card className="bg-primary/ text-primary">
            <CardContent>
                <div className="text-right">
                    <p className="text-base font-medium tabular-nums">
                        {timeFormat.format(now)}
                    </p>

                    <span className="text-xs text-muted-foreground">
                        {dateFormat.format(now)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}