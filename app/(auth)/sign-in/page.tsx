import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
                <div className="space-y-1 text-center">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                        E
                    </div>
                    <h1 className="text-lg font-semibold">Elegant Layers</h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in to the shop management system
                    </p>
                </div>
                <Suspense>
                    <SignInForm />
                </Suspense>
            </div>
        </div>
    );
}