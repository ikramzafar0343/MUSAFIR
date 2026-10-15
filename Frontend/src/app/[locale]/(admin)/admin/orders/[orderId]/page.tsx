import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  formatOrderDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
} from "@/constants/order-status";
import { ADMIN_ROLES } from "@/constants/roles";
import { formatMoney } from "@/constants/storefront";
import { IconOrders } from "@/features/admin/admin-nav-icons";
import { deleteOrderAction,updateOrderStatusAction, updateOrderTrackingAction } from "@/features/admin/catalog-actions";
import { CmsImage } from "@/features/media/cms-image";
import { PrintButton } from "@/features/orders/print-button";
import { orderService } from "@/lib/api/orders";
import { customerWhatsAppSendUrl } from "@/lib/order-whatsapp";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  const { orderId } = await params;
  let order;
  try {
    order = await orderService.getByOrderNumber(orderId, user);
  } catch {
    notFound();
  }
  const status = order.status as OrderStatus;
  const next = ORDER_STATUS_TRANSITIONS[status] ?? [];
  const storefront = await getStorefront();
  const currency = order.currency || storefront.commerce.currency;
  const whatsappUrl = customerWhatsAppSendUrl({
    orderNumber: order.orderNumber,
    customer: order.customer,
    phone: order.phone,
    items: order.items,
    total: order.total,
    currency,
    supportPhone: storefront.content.supportPhone,
  });

  return (
    <div className="admin-product-page">
      <header className="admin-product-toolbar">
        <div className="admin-product-toolbar-copy">
          <p className="admin-orders-crumb">
            <Link href="/admin/orders">Orders</Link>
            <span aria-hidden="true"> / </span>
            <span>{order.orderNumber}</span>
          </p>
          <h1 className="admin-product-title">
            <IconOrders />
            {order.orderNumber}
          </h1>
          <p className="admin-product-sku">
            {formatOrderDate(order.createdAt)}
            {" · "}
            <span className={`admin-status-pill admin-status-pill--${status}`}>{ORDER_STATUS_LABELS[status] ?? status}</span>
          </p>
        </div>
        <div className="admin-product-toolbar-actions">
          {whatsappUrl ? (
            <a href={whatsappUrl} className="admin-product-cta" target="_blank" rel="noreferrer">
              WhatsApp customer
            </a>
          ) : null}
          <form action={deleteOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <ConfirmSubmit
              className="admin-product-delete"
              message="Delete this order permanently from admin? Pending stock will be restored."
              label="Delete order"
              confirmLabel="Delete"
            />
          </form>
          <PrintButton label="Print" className="admin-product-ghost" />
        </div>
      </header>

      <div className="admin-orders-layout">
        <section className="admin-product-card admin-orders-card--items" aria-labelledby="order-items-heading">
          <h2 id="order-items-heading" className="admin-product-card-title">
            Items
          </h2>
          <ul className="admin-orders-lines">
            {order.items.map((item, index) => (
              <li key={`${item.productId}-${index}`} className="admin-orders-line">
                <span className="admin-orders-line-media">
                  {item.imageUrl ? (
                    <CmsImage src={item.imageUrl} alt={item.name} width={72} height={90} className="admin-orders-line-image" />
                  ) : (
                    <span className="admin-orders-thumb-empty">No image</span>
                  )}
                </span>
                <div className="admin-orders-line-copy">
                  <p className="admin-orders-line-name">{item.name}</p>
                  <p className="admin-orders-muted">
                    {item.sku}
                    {item.size ? ` · ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
                  </p>
                  {item.customization ? (
                    <div className="admin-orders-custom">
                      <p>Name: {item.customization.name}</p>
                      {item.customization.color ? (
                        <p className="custom-details-color">
                          Color:{" "}
                          <span className="custom-details-swatch" style={{ background: item.customization.color }} aria-hidden="true" />
                          {item.customization.color}
                        </p>
                      ) : null}
                      {item.customization.notes ? <p>Notes: {item.customization.notes}</p> : null}
                      {item.customization.logoUrl ? (
                        <p className="custom-details-logo">
                          Logo:{" "}
                          <CmsImage
                            src={item.customization.logoUrl}
                            alt={`Logo for ${item.customization.name}`}
                            width={56}
                            height={56}
                            className="custom-details-logo-image"
                          />
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="admin-orders-muted">Qty {item.quantity}</p>
                </div>
                <p className="admin-orders-line-price">{formatMoney(item.price * item.quantity, currency)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-product-card admin-orders-card--status" aria-labelledby="order-status-heading">
          <h2 id="order-status-heading" className="admin-product-card-title">
            Status
          </h2>
          {next.length > 0 ? (
            <form action={updateOrderStatusAction} className="admin-orders-status-form">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="admin-product-label" htmlFor="status">
                Update status
              </label>
              <select id="status" name="status" defaultValue={status} className="admin-product-soft admin-product-select">
                <option value={status}>{ORDER_STATUS_LABELS[status]}</option>
                {next.map((value) => (
                  <option key={value} value={value}>
                    {ORDER_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
              <ConfirmSubmit className="admin-product-cta" message="Update this order status?" label="Update status" />
            </form>
          ) : (
            <p className="admin-orders-muted">{ORDER_STATUS_LABELS[status]} — no further status changes.</p>
          )}
        </section>

        <section className="admin-product-card admin-orders-card--customer" aria-labelledby="order-customer-heading">
          <h2 id="order-customer-heading" className="admin-product-card-title">
            Customer
          </h2>
          <dl className="admin-orders-meta">
            <div>
              <dt>Name</dt>
              <dd>{order.customer}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{order.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{order.phone}</dd>
            </div>
            {whatsappUrl ? (
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  <a href={whatsappUrl} className="admin-orders-open" target="_blank" rel="noreferrer">
                    Send order confirmation
                  </a>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Ship to</dt>
              <dd>
                {order.shipping.address}
                <br />
                {order.shipping.city} {order.shipping.postalCode}
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>Cash on delivery</dd>
            </div>
          </dl>
        </section>

        <section className="admin-product-card admin-orders-card--tracking" aria-labelledby="order-tracking-heading">
          <h2 id="order-tracking-heading" className="admin-product-card-title">
            Tracking
          </h2>
          <form action={updateOrderTrackingAction} className="admin-orders-track-form">
            <input type="hidden" name="orderId" value={order.id} />
            <label className="admin-product-label" htmlFor="trackingNumber">
              Tracking number
            </label>
            <input
              id="trackingNumber"
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              placeholder="ZM-TRACK-0001"
              className="admin-product-soft"
            />
            <label className="admin-product-label" htmlFor="trackingUrl">
              Tracking URL
            </label>
            <input
              id="trackingUrl"
              name="trackingUrl"
              defaultValue={order.trackingUrl ?? ""}
              placeholder="https://"
              className="admin-product-soft"
            />
            <button type="submit" className="admin-product-ghost">
              Save tracking
            </button>
          </form>
        </section>

        <section className="admin-product-card admin-orders-card--totals" aria-labelledby="order-totals-heading">
          <h2 id="order-totals-heading" className="admin-product-card-title">
            Totals
          </h2>
          <dl className="admin-orders-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal, currency)}</dd>
            </div>
            {order.discountAmount > 0 ? (
              <div>
                <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                <dd>−{formatMoney(order.discountAmount, currency)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Shipping</dt>
              <dd>{formatMoney(order.shippingFee, currency)}</dd>
            </div>
            {order.taxAmount > 0 ? (
              <div>
                <dt>{order.taxLabel || "Tax"}</dt>
                <dd>{formatMoney(order.taxAmount, currency)}</dd>
              </div>
            ) : null}
            <div className="admin-orders-total-row">
              <dt>Total</dt>
              <dd>{formatMoney(order.total, currency)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
