import Link from "next/link";
import { redirect } from "next/navigation";

import { IconPlus } from "@/components/icons/icons";
import {
  CATEGORY_LABELS,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
} from "@/constants/catalog";
import {
  formatOrderDate,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/constants/order-status";
import { ADMIN_ROLES, hasPermission } from "@/constants/roles";
import { formatMoney } from "@/constants/storefront";
import { IconOverview } from "@/features/admin/admin-nav-icons";
import { CmsImage } from "@/features/media/cms-image";
import { orderService } from "@/lib/api/orders";
import { productService } from "@/lib/api/products";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

function isLowStock(stock: number, threshold: number) {
  return stock <= 0 || stock <= threshold;
}

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect("/admin/login");
  }
  const [catalog, orders, summary, storefront] = await Promise.all([
    productService.list({ limit: 50, status: "all" }),
    orderService.listAdmin(1, 8),
    orderService.summarize(),
    getStorefront(),
  ]);
  const products = catalog.products;
  const published = products.filter((item) => item.status === PRODUCT_STATUS.PUBLISHED).length;
  const low = products.filter((item) => isLowStock(item.stock, item.lowStockThreshold));
  const pending = summary.byStatus.find((item) => item.status === "pending")?.count ?? 0;
  const snapshot = [...products]
    .sort((left, right) => {
      const leftLow = isLowStock(left.stock, left.lowStockThreshold) ? 0 : 1;
      const rightLow = isLowStock(right.stock, right.lowStockThreshold) ? 0 : 1;
      return leftLow - rightLow;
    })
    .slice(0, 8);

  return (
    <div className="admin-product-page">
      <header className="admin-product-toolbar">
        <div className="admin-product-toolbar-copy">
          <h1 className="admin-product-title">
            <IconOverview />
            Overview
          </h1>
        </div>
        {hasPermission(user.role, "MANAGE_PRODUCTS") ? (
          <div className="admin-product-toolbar-actions">
            <Link href="/admin/products/new" className="admin-product-cta">
              <IconPlus />
              Add Product
            </Link>
          </div>
        ) : null}
      </header>

      <section className="admin-orders-stats" aria-label="Operations summary">
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Products</p>
          <p className="admin-orders-stat-value">{catalog.pagination.total}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Published</p>
          <p className="admin-orders-stat-value">{published}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Orders</p>
          <p className="admin-orders-stat-value">{summary.orders}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Pending</p>
          <p className="admin-orders-stat-value">{pending}</p>
        </article>
      </section>

      <div className="admin-storefront-stack">
      {orders.orders.length === 0 ? (
        <p className="admin-orders-empty">No orders yet.</p>
      ) : (
        <section className="admin-product-card" aria-labelledby="overview-orders-heading">
          <div className="admin-storefront-head">
            <h2 id="overview-orders-heading" className="admin-product-card-title">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="admin-orders-open">
              Open orders
            </Link>
          </div>
          <div className="admin-orders-table-wrap">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th> </th>
                </tr>
              </thead>
              <tbody>
                {orders.orders.map((order) => {
                  const status = String(order.status) as OrderStatus;
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
                        <span className={`admin-status-pill admin-status-pill--${status}`}>
                          {ORDER_STATUS_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td>{formatMoney(Number(order.total), order.currency || storefront.commerce.currency)}</td>
                      <td>
                        <Link href={`/admin/orders/${order.orderNumber}`} className="admin-orders-open">
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {snapshot.length === 0 ? (
        <p className="admin-orders-empty">No products yet.</p>
      ) : (
        <section className="admin-product-card" aria-labelledby="overview-inventory-heading">
          <div className="admin-storefront-head">
            <h2 id="overview-inventory-heading" className="admin-product-card-title">
              Inventory
            </h2>
            <Link href="/admin/inventory" className="admin-orders-open">
              Open inventory
            </Link>
          </div>
          <div className="admin-inventory-table-wrap">
            <table className="admin-inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th> </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.map((product) => {
                  const photo = product.images[0];
                  const status = String(product.status) as ProductStatus;
                  const lowStock = isLowStock(product.stock, product.lowStockThreshold);
                  return (
                    <tr key={String(product.id)}>
                      <td>
                        <div className="admin-inventory-product">
                          <span className="admin-inventory-product-media">
                            {photo?.url ? (
                              <CmsImage
                                src={photo.url}
                                alt={photo.alt || product.title}
                                width={56}
                                height={70}
                                className="admin-inventory-product-image"
                              />
                            ) : (
                              <span className="admin-inventory-product-empty">No image</span>
                            )}
                          </span>
                          <span>
                            <span className="admin-inventory-name">{String(product.title)}</span>
                            <span className="admin-orders-muted">
                              {CATEGORY_LABELS[product.category] ?? product.category}
                              {" · "}
                              {formatMoney(product.effectivePrice, storefront.commerce.currency)}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>{String(product.sku)}</td>
                      <td>
                        <span className={`admin-status-pill admin-status-pill--${status}`}>
                          {PRODUCT_STATUS_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td className={lowStock ? "admin-orders-muted" : undefined}>{product.stock}</td>
                      <td>
                        <Link href={`/admin/products/${product.id}`} className="admin-orders-open">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {low.length > 0 ? (
            <p className="admin-product-kicker">
              {low.length} {low.length === 1 ? "listing" : "listings"} low on stock.
            </p>
          ) : null}
        </section>
      )}
      </div>
    </div>
  );
}
