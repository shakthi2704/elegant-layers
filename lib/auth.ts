import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // internal tool, no email provider set up
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