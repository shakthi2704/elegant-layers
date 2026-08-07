import "dotenv/config";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

async function createUser(
    email: string,
    password: string,
    name: string,
    role: "ADMIN" | "CASHIER"
) {
    const result = await auth.api.signUpEmail({
        body: { email, password, name },
    });
    await prisma.user.update({
        where: { id: result.user.id },
        data: { role },
    });
    console.log(`Created ${role}: ${email}`);
}

async function main() {
    await createUser("admin@elegantlayers.local", "Admin@1234", "Admin", "ADMIN");
    await createUser("cashier@elegantlayers.local", "Cashier@1234", "Cashier", "CASHIER");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });