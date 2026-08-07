import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/sign-in"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
        pathname.startsWith("/api/auth")
    ) {
        return NextResponse.next();
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        const url = new URL("/sign-in", request.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};