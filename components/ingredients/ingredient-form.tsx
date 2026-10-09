"use client";

import { useActionState, useEffect, useRef } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



const UNITS = ["KG", "G", "L", "ML", "PCS"];

export function IngredientForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { name: string; unit: string; minimumStock: number | string };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {defaultValues ? "Edit Ingredient" : "Add Ingredient"}
        </CardTitle>
        <CardDescription>
          {defaultValues
            ? "Update the ingredient details and stock settings below."
            : "Enter the ingredient details and set the minimum stock level."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          ref={formRef}
          key={defaultValues ? JSON.stringify(defaultValues) : "new"}
          action={formAction}
          className="space-y-6"
        >
          {/* Ingredient Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name}
              placeholder="Enter ingredient name"
              required
            />

            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Unit and Minimum Stock */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>

              <Select
                name="unit"
                defaultValue={defaultValues?.unit ?? "KG"}
              >
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>

                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumStock">Minimum Stock</Label>
              <Input
                id="minimumStock"
                name="minimumStock"
                type="number"
                step="0.001"
                min="0"
                defaultValue={defaultValues?.minimumStock ?? 0}
                placeholder="0.000"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div className="rounded-md border border-border bg-muted/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Current stock isn&apos;t set here — it only changes through
              Purchases and Production, so the numbers stay accurate.
            </p>
          </div>

          {/* General Error */}
          {state.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}