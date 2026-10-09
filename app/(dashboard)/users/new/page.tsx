import { requireRole } from "@/lib/require-role";
import { createUser } from "@/app/(dashboard)/users/actions";
import { UserForm } from "@/components/users/user-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default async function NewUserPage() {
    await requireRole(["ADMIN"]);

    return (
        <div className="space-y-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-semibold">Add User</CardTitle>
                    <CardDescription>
                        Create an account for a new admin or cashier.
                    </CardDescription>
                </CardHeader>
            </Card>


            <UserForm action={createUser} mode="create" submitLabel="Add User" />
        </div>
    );
}