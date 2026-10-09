import Link from "next/link";

import { cn } from "@/lib/utils";

export const REPORT_VIEWS = [
    { value: "summary", label: "Profit summary" },
    { value: "daily", label: "Daily income" },
    { value: "products", label: "Sales by product" },
] as const;

export type ReportView = (typeof REPORT_VIEWS)[number]["value"];

/** Turns the raw ?view= value into a valid view, defaulting to "summary". */
export function parseReportView(value: string | undefined): ReportView {
    const match = REPORT_VIEWS.find((v) => v.value === value);
    return match ? match.value : "summary";
}

export function ReportTabs({
    active,
    from,
    to,
}: {
    active: ReportView;
    from: string;
    to: string;
}) {
    return (
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
            {REPORT_VIEWS.map((v) => (
                <Link
                    key={v.value}
                    href={`/reports?view=${v.value}&from=${from}&to=${to}`}
                    className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium",
                        active === v.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {v.label}
                </Link>
            ))}
        </div>
    );
}