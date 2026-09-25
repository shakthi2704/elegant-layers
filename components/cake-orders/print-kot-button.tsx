"use client";

import { Button } from "@/components/ui/button";

export function PrintKotButton() {
    return (
        <Button variant="outline" className="print:hidden" onClick={() => window.print()}>
            Print
        </Button>
    );
}