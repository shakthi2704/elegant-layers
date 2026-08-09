"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { NAV_GROUPS } from "@/lib/nav-config";
import { NavUser } from "@/components/sidebar/nav-user";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";

type SessionUser = {
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
};

export function AppSidebar({
    user,
    ...props
}: { user: SessionUser } & React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();

    const groups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
            (item) => !item.roles || item.roles.includes(user.role)
        ),
    })).filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
                            <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                                E
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Elegant Layers</span>
                                <span className="truncate text-xs text-sidebar-foreground/60">
                                    Cake Shop POS
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <Collapsible key={group.title} defaultOpen className="group/collapsible">
                        <SidebarGroup>
                            <CollapsibleTrigger
                                nativeButton={false}
                                render={
                                    <SidebarGroupLabel className="group flex w-full items-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
                                }
                            >
                                {group.title}
                                <ChevronRight className="ml-auto size-3.5 transition-transform group-data-[panel-open]:rotate-90" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => {
                                            const isActive =
                                                pathname === item.href ||
                                                pathname.startsWith(`${item.href}/`);
                                            const Icon = item.icon;
                                            return (
                                                <SidebarMenuItem key={item.href}>
                                                    <SidebarMenuButton
                                                        isActive={isActive}
                                                        tooltip={item.title}
                                                        render={<Link href={item.href} />}
                                                    >
                                                        <Icon />
                                                        <span>{item.title}</span>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}