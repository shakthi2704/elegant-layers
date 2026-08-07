import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/app/(dashboard)/products/actions";
import { ProductForm } from "@/components/products/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  const boundUpdate = updateProduct.bind(null, product.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Edit Product</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        action={boundUpdate}
        categories={categories}
        submitLabel="Save Changes"
        defaultValues={{
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          sellingPrice: product.sellingPrice.toString(),
          unit: product.unit,
          isFinishedProduct: product.isFinishedProduct,
          minimumStock: product.minimumStock.toString(),
        }}
      />
    </div>
  );
}
