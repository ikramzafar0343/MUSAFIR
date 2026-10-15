import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CUSTOMER_ORDER_STATUS_LABELS } from "@/constants/account";
import { OrderSummary } from "@/features/orders/order-summary";
import { orderService } from "@/lib/api/orders";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const { orderId } = await params;
  let order;
  try {
    order = await orderService.getByOrderNumber(orderId, user);
  } catch {
    notFound();
  }
  const storefront = await getStorefront();
  return (
    <>
      <p className="mb-4 text-sm">
        <Link href="/account/orders" className="underline-offset-4 hover:underline">
          All orders
        </Link>
      </p>
      <h1 className="customer-dashboard-title mb-4">{order.orderNumber}</h1>
      <p className={`customer-order-status customer-order-status--${order.status} mb-6`}>
        {CUSTOMER_ORDER_STATUS_LABELS[order.status] ?? order.status}
      </p>
      <OrderSummary order={order} currency={order.currency || storefront.commerce.currency} />
    </>
  );
}
