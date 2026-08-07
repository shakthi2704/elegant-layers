import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

type Role = "ADMIN" | "CASHIER";

/**
 * Server-side gate for pages restricted to specific roles.
 * The sidebar already hides links a role can't use, but that's cosmetic —
 * this is the actual enforcement in case someone hits the URL directly.
 */
export async function requireRole(allowed: Role[]) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        redirect("/sign-in");
    }

    const user = session.user as typeof session.user & { role: Role };

    if (!allowed.includes(user.role)) {
        redirect("/dashboard");
    }

    return user;
}