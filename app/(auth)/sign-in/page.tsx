import Image from "next/image"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { GalleryVerticalEnd, Cookie } from "lucide-react"

export default function Page() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <GalleryVerticalEnd className="size-10" />
                            <Cookie />

                        </div>
                        Elegant Layers
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <Suspense fallback={null}>
                            <LoginForm />
                        </Suspense>

                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <Image
                    src="/images/wallpaper.jpg"
                    width={600}
                    height={400}
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>

        </div>
    )
}