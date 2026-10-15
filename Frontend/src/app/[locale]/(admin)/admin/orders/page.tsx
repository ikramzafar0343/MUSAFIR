import Link from "next/link";
import { redirect } from "next/navigation";

import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  formatOrderDate,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/constants/order-status";
import { ADMIN_ROLES } from "@/constants/roles";
import { formatMoney } from "@/constants/storefront";
import { IconOrders } from "@/features/admin/admin-nav-icons";
import { deleteOrderAction } from "@/features/admin/catalog-actions";
import { CmsImage } from "@/features/media/cms-image";
import { orderService } from "@/lib/api/orders";
import { customerWhatsAppSendUrl } from "@/lib/order-whatsapp";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

const STATUS_FILTERS = ["all", ...Object.values(ORDER_STATUS)] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  const { status: rawStatus } = await searchParams;
  const statusFilter = (STATUS_FILTERS as readonly string[]).includes(rawStatus ?? "")
    ? (rawStatus as (typeof STATUS_FILTERS)[number])
    : "all";
  const [result, summary, storefront] = await Promise.all([
    orderService.listAdmin(1, 50, statusFilter === "all" ? undefined : statusFilter),
    orderService.summarize(),
    getStorefront(),
  ]);
  const countFor = (status: string) => summary.byStatus.find((item) => item.status === status)?.count ?? 0;

  return (
    <div className="admin-product-page">
      <header className="admin-product-toolbar">
        <div className="admin-product-toolbar-copy">
          <h1 className="admin-product-title">
            <IconOrders />
            Orders
          </h1>
        </div>
      </header>

      <section className="admin-orders-stats" aria-label="Order counts">
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Total</p>
          <p className="admin-orders-stat-value">{summary.orders}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Pending</p>
          <p className="admin-orders-stat-value">{countFor("pending")}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Processing</p>
          <p className="admin-orders-stat-value">{countFor("processing")}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Shipped</p>
          <p className="admin-orders-stat-value">{countFor("shipped")}</p>
        </article>
      </section>

      <nav className="admin-orders-filters" aria-label="Filter by status">
        {STATUS_FILTERS.map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/admin/orders" : `/admin/orders?status=${value}`}
            className={`admin-orders-filter${statusFilter === value ? " is-active" : ""}`}
          >
            {value === "all" ? "All" : ORDER_STATUS_LABELS[value]}
          </Link>
        ))}
      </nav>

      {result.orders.length === 0 ? (
        <p className="admin-orders-empty">No orders in this view.</p>
      ) : (
        <section className="admin-product-card">
          <div className="admin-orders-table-wrap">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th> </th>
                </tr>
              </thead>
              <tbody>
                {result.orders.map((order) => {
                  const status = String(order.status) as OrderStatus;
                  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const photo = order.items.find((item) => item.imageUrl)?.imageUrl;
                  const whatsappUrl = customerWhatsAppSendUrl({
                    orderNumber: String(order.orderNumber),
                    customer: String(order.customer),
                    phone: String(order.phone),
                    items: order.items,
                    total: Number(order.total),
                    currency: order.currency || storefront.commerce.currency,
                    supportPhone: storefront.content.supportPhone,
                  });
                  return (
                    <tr key={String(order._id)}>
                      <td>
                        <p className="admin-orders-id">{String(order.orderNumber)}</p>
                        <p className="admin-orders-muted">{formatOrderDate(order.createdAt)}</p>
                      </td>
                      <td>
                        <p>{String(order.customer)}</p>
                        <p className="admin-orders-muted">{String(order.email)}</p>
                      </td>
                      <td>
                        <div className="admin-orders-items-cell">
                          <span className="admin-orders-thumb">
                            {photo ? (
                              <CmsImage src={photo} alt="" width={40} height={40} className="admin-orders-thumb-img" />
                            ) : (
                              <span className="admin-orders-thumb-empty" />
                            )}
                          </span>
                          <span>
                            {units} {units === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-pill admin-status-pill--${status}`}>
                          {ORDER_STATUS_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td>{formatMoney(Number(order.total), order.currency || storefront.commerce.currency)}</td>
                      <td>
                        <div className="admin-orders-items-cell" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                          <Link href={`/admin/orders/${order.orderNumber}`} className="admin-orders-open">
                            Open
                          </Link>
                          {whatsappUrl ? (
                            <a href={whatsappUrl} className="admin-orders-open" target="_blank" rel="noreferrer">
                              WhatsApp
                            </a>
                          ) : null}
                          <form action={deleteOrderAction}>
                            <input type="hidden" name="orderId" value={String(order.id)} />
                            <ConfirmSubmit
                              className="admin-product-delete"
                              message={`Delete order ${order.orderNumber}?`}
                              label="Delete"
                              confirmLabel="Delete"
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
