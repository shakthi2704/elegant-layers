import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/app/(dashboard)/products/actions";
import { ProductForm } from "@/components/products/product-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";


export default async function NewProductPage() {
  await requireRole(["ADMIN"]);

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">Add Product</CardTitle>
        </CardHeader>
      </Card>
      <ProductForm action={createProduct} categories={categories} submitLabel="Create Product" />
    </div>
  );
}
