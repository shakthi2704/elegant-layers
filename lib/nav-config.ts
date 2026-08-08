import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wheat,
  Warehouse,
  Truck,
  ShoppingBag,
  BookOpen,
  Factory,
  CakeSlice,
  Receipt,
  BarChart3,
  Users,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. Omit to allow both. */
  roles?: Array<"ADMIN" | "CASHIER">;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [
      { title: "POS Billing", href: "/pos", icon: ShoppingCart },
      { title: "Cake Orders", href: "/cake-orders", icon: CakeSlice },
    ],
  },
  {
    title: "Catalog",
    items: [
      { title: "Products", href: "/products", icon: Package, roles: ["ADMIN"] },
      { title: "Ingredients", href: "/ingredients", icon: Wheat, roles: ["ADMIN"] },
      { title: "Recipes", href: "/recipes", icon: BookOpen, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Production", href: "/production", icon: Factory, roles: ["ADMIN"] },
      { title: "Inventory", href: "/inventory", icon: Warehouse, roles: ["ADMIN"] },
      { title: "Suppliers", href: "/suppliers", icon: Truck, roles: ["ADMIN"] },
      { title: "Purchases", href: "/purchases", icon: ShoppingBag, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Expenses", href: "/expenses", icon: Receipt, roles: ["ADMIN"] },
      { title: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Administration",
    items: [{ title: "Users", href: "/users", icon: Users, roles: ["ADMIN"] }],
  },
];