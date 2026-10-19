import type { Permission } from "@/constants/roles";

export type AdminNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  /** null = any admin role may see this item */
  readonly permission: Permission | null;
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { id: "overview", label: "Overview", href: "/admin", permission: null },
  { id: "inventory", label: "Inventory", href: "/admin/inventory", permission: "MANAGE_INVENTORY" },
  { id: "orders", label: "Orders", href: "/admin/orders", permission: "MANAGE_ORDERS" },
  { id: "storefront", label: "Storefront", href: "/admin/customer-side", permission: "MANAGE_CMS" },
  { id: "promos", label: "Promos", href: "/admin/promos", permission: "MANAGE_PRODUCTS" },
];

export const ADMIN_QUICK_ACTIONS = [
  {
    id: "add-product",
    title: "Add New Product",
    description: "Create a new listing",
    href: "/admin/products/new",
    permission: "MANAGE_PRODUCTS" as Permission,
  },
  {
    id: "inventory",
    title: "Manage Inventory",
    description: "Update stock levels",
    href: "/admin/inventory",
    permission: "MANAGE_INVENTORY" as Permission,
  },
  {
    id: "orders",
    title: "Orders Overview",
    description: "Review all orders",
    href: "/admin/orders",
    permission: "MANAGE_ORDERS" as Permission,
  },
  {
    id: "customer-side",
    title: "Storefront",
    description: "Colors, homepage PNGs, copy, and checkout fees",
    href: "/admin/customer-side",
    permission: "MANAGE_CMS" as Permission,
  },
  {
    id: "promos",
    title: "Promo codes",
    description: "Percentage or fixed discounts",
    href: "/admin/promos",
    permission: "MANAGE_PRODUCTS" as Permission,
  },
] as const;
