import { requireRole } from "@/lib/require-role";
import { createSupplier } from "@/app/(dashboard)/suppliers/actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default async function NewSupplierPage() {
    await requireRole(["ADMIN"]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Add Supplier</h1>
            </div>
            <SupplierForm action={createSupplier} submitLabel="Create Supplier" />
        </div>
    );
}