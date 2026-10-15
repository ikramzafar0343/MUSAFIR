import Link from "next/link";
import { redirect } from "next/navigation";

import { CUSTOMER_ORDER_STATUS_LABELS } from "@/constants/account";
import { formatMoney } from "@/constants/storefront";
import { orderService } from "@/lib/api/orders";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function AccountOrdersPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const [result, storefront] = await Promise.all([
    orderService.listMine(user.id, 1, 50),
    getStorefront(),
  ]);
  return (
    <>
      <h1 className="customer-dashboard-title mb-8">Orders</h1>
      {result.orders.length === 0 ? (
        <p className="text-sm text-text-sub">You have no orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {result.orders.map((order) => (
            <li key={String(order._id)} className="customer-order-card">
              <div className="customer-order-card-head">
                <div>
                  <p className="customer-order-card-id">{String(order.orderNumber)}</p>
                </div>
                <span className={`customer-order-status customer-order-status--${String(order.status)}`}>
                  {CUSTOMER_ORDER_STATUS_LABELS[String(order.status)] ?? String(order.status)}
                </span>
              </div>
              <p className="customer-order-card-total">{formatMoney(Number(order.total), order.currency || storefront.commerce.currency)}</p>
              <Link href={`/account/orders/${order.orderNumber}`} className="mt-3 inline-block text-sm underline-offset-4 hover:underline">
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
