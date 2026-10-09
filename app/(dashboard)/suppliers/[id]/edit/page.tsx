import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateSupplier } from "@/app/(dashboard)/suppliers/actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";


export default async function EditSupplierPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
        notFound();
    }

    const boundUpdate = updateSupplier.bind(null, supplier.id);

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-xl">Edit supplier</CardTitle>
                </CardHeader>
            </Card>
            <SupplierForm
                action={boundUpdate}
                submitLabel="Save Changes"
                defaultValues={{
                    name: supplier.name,
                    contact: supplier.contact,
                    address: supplier.address,
                }}
            />
        </div>
    );
}