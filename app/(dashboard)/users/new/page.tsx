import { requireRole } from "@/lib/require-role";
import { createUser } from "@/app/(dashboard)/users/actions";
import { UserForm } from "@/components/users/user-form";

export default async function NewUserPage() {
    await requireRole(["ADMIN"]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Add User</h1>
                <p className="text-sm text-muted-foreground">
                    Create an account for a new admin or cashier.
                </p>
            </div>

            <UserForm action={createUser} mode="create" submitLabel="Add User" />
        </div>
    );
}