export const CUSTOMER_DASHBOARD_NAV = [
  { id: "dashboard", label: "Dashboard", path: "/account" },
  { id: "orders", label: "Orders", path: "/account/orders" },
  { id: "wishlist", label: "Wishlist", path: "/wishlist" },
  { id: "addresses", label: "Addresses", path: "/account/addresses" },
  { id: "settings", label: "Settings", path: "/account/settings" },
] as const;

export const CUSTOMER_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function getCustomerFirstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Member";
  }
  return trimmed.split(/\s+/)[0] ?? "Member";
}
