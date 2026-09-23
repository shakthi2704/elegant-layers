"use client";

import { Button } from "@/components/ui/button";

export function PrintBillButton() {
    return (
        <Button
            variant="outline"
            className="print:hidden"
            onClick={() => window.print()}
        >
            Print Bill
        </Button>
    );
}