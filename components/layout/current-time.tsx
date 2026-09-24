"use client";

import { useEffect, useState } from "react";

export function CurrentTime() {
    const [time, setTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            setTime(
                new Intl.DateTimeFormat("en-LK", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                }).format(new Date())
            );
        };

        updateTime();

        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">The time is</span>
            <time className="font-medium tabular-nums">{time}</time>
        </div>
    );
}
