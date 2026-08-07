import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/app/(dashboard)/products/actions";
import { ProductForm } from "@/components/products/product-form";

export default async function NewProductPage() {
  await requireRole(["ADMIN"]);

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Add Product</h1>
        <p className="text-sm text-muted-foreground">
          New products start Active with 0 stock — stock comes in through Production.
        </p>
      </div>
      <ProductForm action={createProduct} categories={categories} submitLabel="Create Product" />
    </div>
  );
}
