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
    await createUser("owner1@elegantlayers.local", "ChangeMe@1234", "Owner One", "ADMIN");
    await createUser("owner2@elegantlayers.local", "ChangeMe@1234", "Owner Two", "ADMIN");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });