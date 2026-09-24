import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { prisma } from "@/lib/prisma";
export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : undefined,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // internal tool, no email provider set up
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/sign-in/email") {
                return;
            }

            const email = ctx.body?.email;
            if (!email) {
                return;
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (user && !user.isActive) {
                throw new APIError("UNAUTHORIZED", {
                    message: "This account has been deactivated. Contact an admin.",
                });
            }
        }),
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "CASHIER",
                input: false, // clients can never set their own role — only server-side code can
            },
            isActive: {
                type: "boolean",
                defaultValue: true,
                input: false,
            },
        },
    },
    session: {
        expiresIn: 60 * 60 * 8, // 8 hours — reasonable for a shared shop terminal
    },
});