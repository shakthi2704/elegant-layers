import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator"
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { updateUser } from "@/app/(dashboard)/users/actions";
import { UserForm } from "@/components/users/user-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";


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
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-xl">Edit User</CardTitle>
                    <CardDescription>
                        Update the user’s account details and permissions.
                    </CardDescription>

                    <p className="pt-1 text-sm text-muted-foreground">
                        Editing account:{" "}
                        <span className="text-foreground">{user.email}</span>
                    </p>
                </CardHeader>
            </Card>


            <UserForm
                action={updateUser.bind(null, user.id)}
                mode="edit"
                defaultValues={{
                    name: user.name,
                    role: user.role as "ADMIN" | "CASHIER",
                }}
                submitLabel="Save Changes"
            />
        </div>

    );
}