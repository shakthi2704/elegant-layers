"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/(dashboard)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string };

type ProductFormValues = {
  name: string;
  sku: string;
  categoryId: string;
  sellingPrice: number | string;
  unit: string;
  isFinishedProduct: boolean;
  minimumStock: number | string;
};

const UNITS = ["PCS", "KG", "G", "L", "ML"];

export function ProductForm({
  action,
  categories,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  defaultValues?: Partial<ProductFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      key={defaultValues ? JSON.stringify(defaultValues) : "new"}
      action={formAction}
      className="max-w-lg space-y-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={defaultValues?.sku} required />
          {state.fieldErrors?.sku && (
            <p className="text-sm text-destructive">{state.fieldErrors.sku[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId" defaultValue={defaultValues?.categoryId}>
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Select category">
                {(value: string | null) =>
                  categories.find((c) => c.id === value)?.name ?? "Select category"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.categoryId && (
            <p className="text-sm text-destructive">{state.fieldErrors.categoryId[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sellingPrice">Selling Price</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.sellingPrice}
            required
          />
          {state.fieldErrors?.sellingPrice && (
            <p className="text-sm text-destructive">{state.fieldErrors.sellingPrice[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unit">Unit</Label>
          <Select name="unit" defaultValue={defaultValues?.unit ?? "PCS"}>
            <SelectTrigger id="unit">
              <SelectValue />
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minimumStock">Minimum Stock (low-stock alert threshold)</Label>
        <Input
          id="minimumStock"
          name="minimumStock"
          type="number"
          step="0.001"
          min="0"
          defaultValue={defaultValues?.minimumStock ?? 0}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isFinishedProduct"
          name="isFinishedProduct"
          type="checkbox"
          defaultChecked={defaultValues?.isFinishedProduct ?? true}
          className="size-4 rounded border-input"
        />
        <Label htmlFor="isFinishedProduct" className="font-normal">
          Tracked via Production (uses a Recipe to consume ingredients)
        </Label>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
