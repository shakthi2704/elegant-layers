
import Image from "next/image"
import { LoginForm } from "@/components/auth/login-form"

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex justify-center">
                    {/* <Image
                        src="/logo/logo.png"
                        alt="Elegant Layers"
                        width={56}
                        height={56}
                        unoptimized
                        className="mx-auto mb-2 h-14 w-14 rounded-lg object-cover"
                    /> */}
                    <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                        E
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Elegant Layers</span>
                        <span className="truncate text-xs text-sidebar-foreground/60">
                            Cake Shop POS
                        </span>
                    </div>
                </div>

                <LoginForm />
            </div>
        </div>
    )
}

