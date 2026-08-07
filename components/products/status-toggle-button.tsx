"use client";

import { useTransition } from "react";

import { toggleProductStatus } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";

export function StatusToggleButton({
  productId,
  status,
}: {
  productId: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => toggleProductStatus(productId))}
    >
      {status === "ACTIVE" ? "Deactivate" : "Activate"}
    </Button>
  );
}
