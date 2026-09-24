"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import type { ActionState } from "@/app/(dashboard)/products/actions";

export async function createUser(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = createUserSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
    });
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
        return { fieldErrors: { email: ["A user with this email already exists."] } };
    }

    let newUserId: string;
    try {
        const result = await auth.api.signUpEmail({
            body: {
                email: parsed.data.email,
                password: parsed.data.password,
                name: parsed.data.name,
            },
        });
        newUserId = result.user.id;
    } catch {
        return { error: "Couldn't create the account. Check the password meets requirements." };
    }

    await prisma.user.update({
        where: { id: newUserId },
        data: { role: parsed.data.role },
    });

    revalidatePath("/users");
    redirect("/users");
}

export async function updateUser(
    userId: string,
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requireRole(["ADMIN"]);

    const parsed = updateUserSchema.safeParse({
        name: formData.get("name"),
        role: formData.get("role"),
    });
    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await prisma.user.update({
        where: { id: userId },
        data: parsed.data,
    });

    revalidatePath("/users");
    revalidatePath(`/users/${userId}/edit`);
    return { success: true };
}

export async function toggleUserActive(userId: string): Promise<ActionState> {
    const currentUser = await requireRole(["ADMIN"]);

    if (userId === currentUser.id) {
        return { error: "You can't deactivate your own account." };
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
        return { error: "User not found." };
    }

    if (target.isActive && target.role === "ADMIN") {
        const activeAdminCount = await prisma.user.count({
            where: { role: "ADMIN", isActive: true },
        });
        if (activeAdminCount <= 1) {
            return { error: "Can't deactivate the last remaining active admin." };
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isActive: !target.isActive },
    });

    revalidatePath("/users");
    return { success: true };
}