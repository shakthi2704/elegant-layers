import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateUser } from "@/app/(dashboard)/users/actions";
import { UserForm } from "@/components/users/user-form";

export default async function EditUserPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireRole(["ADMIN"]);
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Edit User</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <UserForm
                action={updateUser.bind(null, user.id)}
                mode="edit"
                defaultValues={{ name: user.name, role: user.role as "ADMIN" | "CASHIER" }}
                submitLabel="Save Changes"
            />
        </div>
    );
}