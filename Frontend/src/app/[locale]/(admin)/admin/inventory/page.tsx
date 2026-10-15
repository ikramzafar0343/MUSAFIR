import Link from "next/link";
import { redirect } from "next/navigation";

import { IconPlus } from "@/components/icons/icons";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  CATEGORY_LABELS,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
} from "@/constants/catalog";
import { ADMIN_ROLES } from "@/constants/roles";
import { formatMoney } from "@/constants/storefront";
import { IconInventory } from "@/features/admin/admin-nav-icons";
import { deleteProductAction, updateStockAction } from "@/features/admin/catalog-actions";
import { CmsImage } from "@/features/media/cms-image";
import { productService } from "@/lib/api/products";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

const STATUS_FILTERS = ["all", ...Object.values(PRODUCT_STATUS), "low"] as const;

function isLowStock(stock: number, threshold: number) {
  return stock <= 0 || stock <= threshold;
}

export default async function AdminInventoryPage({
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
  const [result, storefront] = await Promise.all([
    productService.list({ limit: 50, status: "all" }),
    getStorefront(),
  ]);
  const products = result.products;
  const published = products.filter((item) => item.status === PRODUCT_STATUS.PUBLISHED).length;
  const drafts = products.filter((item) => item.status === PRODUCT_STATUS.DRAFT).length;
  const low = products.filter((item) => isLowStock(item.stock, item.lowStockThreshold)).length;
  const visible = products.filter((item) => {
    if (statusFilter === "low") {
      return isLowStock(item.stock, item.lowStockThreshold);
    }
    if (statusFilter === "all") {
      return true;
    }
    return item.status === statusFilter;
  });

  return (
    <div className="admin-product-page">
      <header className="admin-product-toolbar">
        <div className="admin-product-toolbar-copy">
          <h1 className="admin-product-title">
            <IconInventory />
            Inventory
          </h1>
        </div>
        <div className="admin-product-toolbar-actions">
          <Link href="/admin/products/new" className="admin-product-cta">
            <IconPlus />
            Add Product
          </Link>
        </div>
      </header>

      <section className="admin-orders-stats" aria-label="Catalog counts">
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Total</p>
          <p className="admin-orders-stat-value">{result.pagination.total}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Published</p>
          <p className="admin-orders-stat-value">{published}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Drafts</p>
          <p className="admin-orders-stat-value">{drafts}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Low stock</p>
          <p className="admin-orders-stat-value">{low}</p>
        </article>
      </section>

      <nav className="admin-orders-filters" aria-label="Filter products">
        {STATUS_FILTERS.map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/admin/inventory" : `/admin/inventory?status=${value}`}
            className={`admin-orders-filter${statusFilter === value ? " is-active" : ""}`}
          >
            {value === "all" ? "All" : value === "low" ? "Low stock" : PRODUCT_STATUS_LABELS[value]}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="admin-orders-empty">No products in this view.</p>
      ) : (
        <section className="admin-product-card">
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
                {visible.map((product) => {
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
                      <td>
                        <form action={updateStockAction} className="admin-inventory-stock">
                          <input type="hidden" name="productId" value={product.id} />
                          <input
                            type="number"
                            name="stock"
                            min="0"
                            defaultValue={product.stock}
                            aria-label={`Stock for ${product.title}`}
                            className={`admin-product-soft admin-inventory-stock-input${lowStock ? " is-low" : ""}`}
                          />
                          <ConfirmSubmit className="admin-orders-open" message="Save this stock level?" label="Save" />
                        </form>
                      </td>
                      <td>
                        <div className="admin-inventory-row-actions">
                          <Link href={`/admin/products/${product.id}`} className="admin-orders-open">
                            Edit
                          </Link>
                          <form action={deleteProductAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <ConfirmSubmit className="admin-product-delete" message="Archive this product?" label="Delete" />
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
