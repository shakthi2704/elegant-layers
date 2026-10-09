"use client";

import { useActionState } from "react";

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


type Category = { id: string; name: string };

export function ProductForm({
  action,
  categories,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  defaultValues?: {
    name?: string;
    sku?: string;
    categoryId?: string;
    sellingPrice?: number | string;
    unit?: string;
    isFinishedProduct?: boolean;
    minimumStock?: number | string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {defaultValues ? "Edit Product" : "Add Product"}
        </CardTitle>
        <CardDescription>
          {defaultValues
            ? "Update the product details and stock settings below."
            : "Enter the product details and configure how its stock is tracked."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          key={defaultValues ? JSON.stringify(defaultValues) : "new"}
          action={formAction}
          className="space-y-6"
        >
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name}
              placeholder="Enter product name"
              required
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              defaultValue={defaultValues?.sku}
              placeholder="Enter SKU"
              required
            />
            {state.fieldErrors?.sku && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.sku[0]}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              name="categoryId"
              defaultValue={defaultValues?.categoryId}
            >
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Select category">
                  {(value: string | null) =>
                    categories.find((c) => c.id === value)?.name ??
                    "Select category"
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
              <p className="text-sm text-destructive">
                {state.fieldErrors.categoryId[0]}
              </p>
            )}
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling Price</Label>
            <Input
              id="sellingPrice"
              name="sellingPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.sellingPrice}
              placeholder="0.00"
              required
            />
            {state.fieldErrors?.sellingPrice && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.sellingPrice[0]}
              </p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              name="unit"
              defaultValue={defaultValues?.unit ?? "PCS"}
            >
              <SelectTrigger id="unit" className="w-full">
                <SelectValue placeholder="Select unit">
                  {(value: string | null) => value ?? "Select unit"}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="KG">KG</SelectItem>
                <SelectItem value="G">G</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="ML">ML</SelectItem>
                <SelectItem value="PCS">PCS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Stock */}
          <div className="space-y-2">
            <Label htmlFor="minimumStock">Minimum Stock</Label>
            <Input
              id="minimumStock"
              name="minimumStock"
              type="number"
              step="0.001"
              min="0"
              defaultValue={defaultValues?.minimumStock}
              placeholder="0.000"
            />
            <p className="text-xs text-muted-foreground">
              Set the minimum quantity to maintain before stock needs
              replenishment.
            </p>
          </div>

          {/* Finished Product */}
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <input
                id="isFinishedProduct"
                name="isFinishedProduct"
                type="checkbox"
                defaultChecked={defaultValues?.isFinishedProduct ?? true}
                className="mt-0.5 size-4 rounded border-input accent-primary"
              />

              <div className="space-y-1">
                <Label htmlFor="isFinishedProduct">
                  Finished product (tracks stock)
                </Label>

                <p className="text-sm text-muted-foreground">
                  Stock comes in through Production and is deducted when
                  sold. Untick for items sold directly, where the recipe&apos;s
                  ingredients are deducted instead.
                </p>
              </div>
            </div>
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