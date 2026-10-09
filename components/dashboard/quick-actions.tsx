import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type Action = {
    label: string;
    href: string;
    adminOnly?: boolean;
};

const ACTIONS: Action[] = [
    { label: "New Sale", href: "/pos" },
    { label: "New Cake Order", href: "/cake-orders/new" },
    { label: "New Purchase", href: "/purchases/new", adminOnly: true },
    { label: "New Production", href: "/production/new", adminOnly: true },
];

export function QuickActions({ isAdmin }: { isAdmin: boolean }) {
    const actions = ACTIONS.filter((a) => isAdmin || !a.adminOnly);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {actions.map((a, index) => (
                        <Button
                            key={a.href}
                            variant={index === 0 ? "default" : "secondary"}
                            nativeButton={false}
                            render={<Link href={a.href} />}
                            size="lg"
                        >
                            {a.label}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

