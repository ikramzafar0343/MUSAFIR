import Link from "next/link";
import { redirect } from "next/navigation";

import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { DISCOUNT_TYPES } from "@/constants/catalog";
import { ADMIN_ROLES } from "@/constants/roles";
import { formatMoney } from "@/constants/storefront";
import { IconPromos } from "@/features/admin/admin-nav-icons";
import { togglePromoAction } from "@/features/admin/ops-actions";
import { PromoCreateForm } from "@/features/admin/promo-create-form";
import { type PromoRow, promoService } from "@/lib/api/promo";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";

const STATUS_FILTERS = ["all", "active", "inactive"] as const;

function amountLabel(item: PromoRow, currency: string): string {
  const amount = Number(item.amount);
  if (item.discount_type === DISCOUNT_TYPES.PERCENTAGE) {
    return `${amount}% off`;
  }
  return `${formatMoney(amount, currency)} off`;
}

export default async function AdminPromosPage({
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
  const [codes, storefront] = await Promise.all([promoService.list(), getStorefront()]);
  const active = codes.filter((item) => item.active);
  const inactive = codes.filter((item) => !item.active);
  const visible = statusFilter === "active" ? active : statusFilter === "inactive" ? inactive : codes;
  const currency = storefront.commerce.currency;

  return (
    <div className="admin-product-page">
      <header className="admin-product-toolbar">
        <div className="admin-product-toolbar-copy">
          <h1 className="admin-product-title">
            <IconPromos />
            Promos
          </h1>
        </div>
      </header>

      <section className="admin-orders-stats" aria-label="Promo counts">
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Total</p>
          <p className="admin-orders-stat-value">{codes.length}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Active</p>
          <p className="admin-orders-stat-value">{active.length}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Inactive</p>
          <p className="admin-orders-stat-value">{inactive.length}</p>
        </article>
        <article className="admin-orders-stat">
          <p className="admin-orders-stat-label">Percentage</p>
          <p className="admin-orders-stat-value">
            {codes.filter((item) => item.discount_type === DISCOUNT_TYPES.PERCENTAGE).length}
          </p>
        </article>
      </section>

      <PromoCreateForm currency={currency} />

      <nav className="admin-orders-filters" aria-label="Filter promo codes">
        {STATUS_FILTERS.map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/admin/promos" : `/admin/promos?status=${value}`}
            className={`admin-orders-filter${statusFilter === value ? " is-active" : ""}`}
          >
            {value === "all" ? "All" : value === "active" ? "Active" : "Inactive"}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="admin-orders-empty">No promo codes in this view.</p>
      ) : (
        <section className="admin-product-card">
          <div className="admin-inventory-table-wrap">
            <table className="admin-inventory-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Offer</th>
                  <th>Minimum</th>
                  <th>Status</th>
                  <th> </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="admin-inventory-name">{item.code}</p>
                    </td>
                    <td>{amountLabel(item, currency)}</td>
                    <td>
                      {Number(item.min_subtotal) > 0 ? formatMoney(Number(item.min_subtotal), currency) : "None"}
                    </td>
                    <td>
                      <span className={`admin-status-pill admin-status-pill--${item.active ? "published" : "archived"}`}>
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inventory-row-actions">
                        <form action={togglePromoAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="active" value={item.active ? "false" : "true"} />
                          <ConfirmSubmit
                            className={item.active ? "admin-product-delete" : "admin-orders-open"}
                            message={
                              item.active
                                ? "Disable this code at checkout?"
                                : "Enable this code at checkout?"
                            }
                            label={item.active ? "Disable" : "Enable"}
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
