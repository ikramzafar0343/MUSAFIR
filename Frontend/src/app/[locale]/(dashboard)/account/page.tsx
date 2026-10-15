import Link from "next/link";
import { redirect } from "next/navigation";

import { getCustomerFirstName } from "@/constants/account";
import { formatMoney } from "@/constants/storefront";
import { logoutAction } from "@/features/auth/actions";
import { orderService } from "@/lib/api/orders";
import { resolveAndPruneCart } from "@/lib/resolve-cart";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";
import { readWishlist } from "@/lib/wishlist-cookie";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const [orders, wishlist, cart, storefront] = await Promise.all([
    orderService.listMine(user.id, 1, 3),
    readWishlist(),
    resolveAndPruneCart(),
    getStorefront(),
  ]);
  const cartCount = cart.count;

  return (
    <>
      <section className="customer-dashboard-hero">
        <div>
          <p className="customer-dashboard-eyebrow">Member Dashboard</p>
          <h1 className="customer-dashboard-title">Welcome back, {getCustomerFirstName(user.name)}</h1>
          <p className="customer-dashboard-lead">{user.email}</p>
        </div>
        <div className="customer-dashboard-hero-actions">
          <Link href="/collections/all" className="luxury-button-solid customer-dashboard-btn">
            Shop New
          </Link>
          <Link href="/account/orders" className="luxury-button-outline customer-dashboard-btn">
            View Orders
          </Link>
        </div>
      </section>
      <section className="customer-dashboard-stats" aria-label="Account overview">
        <article className="customer-dashboard-stat">
          <p className="customer-dashboard-stat-value">{orders.pagination.total}</p>
          <p className="customer-dashboard-stat-label">Orders</p>
        </article>
        <article className="customer-dashboard-stat">
          <p className="customer-dashboard-stat-value">{wishlist.ids.length}</p>
          <p className="customer-dashboard-stat-label">Wishlist</p>
        </article>
        <article className="customer-dashboard-stat">
          <p className="customer-dashboard-stat-value">{cartCount}</p>
          <p className="customer-dashboard-stat-label">Cart Items</p>
        </article>
      </section>
      <section>
        <h2 className="mb-4 text-sm tracking-[0.18em] uppercase">Recent orders</h2>
        {orders.orders.length === 0 ? (
          <p className="text-sm text-text-sub">No orders yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.orders.map((order) => (
              <li key={String(order._id)}>
                <Link href={`/account/orders/${order.orderNumber}`} className="customer-order-card">
                  <p className="customer-order-card-id">{String(order.orderNumber)}</p>
                  <p className="customer-order-card-date">{String(order.status)}</p>
                  <p className="customer-order-card-total">{formatMoney(Number(order.total), order.currency || storefront.commerce.currency)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form action={logoutAction} className="mt-8">
        <button type="submit" className="luxury-button-outline">
          Sign out
        </button>
      </form>
    </>
  );
}
