import { requireRole } from "@/lib/require-role";
import { createSupplier } from "@/app/(dashboard)/suppliers/actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import {
    Card, CardHeader, CardTitle
} from "@/components/ui/card";


export default async function NewSupplierPage() {
    await requireRole(["ADMIN"]);

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">Add Supplier</CardTitle>
                </CardHeader>
            </Card>
            <SupplierForm action={createSupplier} submitLabel="Create Supplier" />
        </div>
    );
}