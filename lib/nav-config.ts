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

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "POS Billing", href: "/pos", icon: ShoppingCart },
  { title: "Cake Orders", href: "/cake-orders", icon: CakeSlice },
  { title: "Products", href: "/products", icon: Package, roles: ["ADMIN"] },
  { title: "Ingredients", href: "/ingredients", icon: Wheat, roles: ["ADMIN"] },
  { title: "Recipes", href: "/recipes", icon: BookOpen, roles: ["ADMIN"] },
  { title: "Production", href: "/production", icon: Factory, roles: ["ADMIN"] },
  { title: "Inventory", href: "/inventory", icon: Warehouse, roles: ["ADMIN"] },
  { title: "Suppliers", href: "/suppliers", icon: Truck, roles: ["ADMIN"] },
  { title: "Purchases", href: "/purchases", icon: ShoppingBag, roles: ["ADMIN"] },
  { title: "Expenses", href: "/expenses", icon: Receipt, roles: ["ADMIN"] },
  { title: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN"] },
  { title: "Users", href: "/users", icon: Users, roles: ["ADMIN"] },
];
