import { redirect } from "next/navigation";

import { PRODUCT_STATUS } from "@/constants/catalog";
import { calculateOrderTotals, getFreeShippingNote } from "@/constants/commerce";
import { SUPPORT_EMAIL } from "@/constants/site";
import { formatMoney } from "@/constants/storefront";
import { CustomizationDetails } from "@/features/catalog/customization-details";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { OrderTotals } from "@/features/checkout/order-totals";
import { addressService } from "@/lib/api/addresses";
import { orderService } from "@/lib/api/orders";
import { resolveAndPruneCart } from "@/lib/resolve-cart";
import { getSessionUser } from "@/lib/session";

export default async function CheckoutPage() {
  const [{ items, products }, user, commerce] = await Promise.all([
    resolveAndPruneCart(),
    getSessionUser(),
    orderService.getCommerceSettings(),
  ]);
  if (items.length === 0) {
    redirect("/cart");
  }
  const addresses = user ? await addressService.list(user.id) : [];
  const lines = items
    .map((item) => {
      const product = products.get(item.productId);
      if (!product || product.status !== PRODUCT_STATUS.PUBLISHED) {
        return null;
      }
      const price = Number(product.effectivePrice ?? product.price ?? 0);
      return {
        title: String(product.title),
        quantity: item.quantity,
        size: item.size ?? null,
        customization: item.customization ?? null,
        lineTotal: price * item.quantity,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);
  if (lines.length === 0) {
    redirect("/cart");
  }
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totals = calculateOrderTotals(subtotal, commerce);

  return (
    <div className="checkout-page">
      <div className="mx-auto max-w-[1600px] px-6 md:px-20">
        <header className="section-intro checkout-intro">
          <span className="section-intro-eyebrow">Checkout</span>
          <h1 className="section-intro-title">Complete Your Order</h1>
          <p className="section-intro-description">
            Enter your delivery details. We deliver across Pakistan. Payment is cash on delivery only.
          </p>
        </header>
        <div className="checkout-layout">
          <CheckoutForm
            defaultName={user?.name}
            defaultEmail={user?.email}
            addresses={addresses}
          />
          <aside className="checkout-summary">
            <p className="checkout-summary-title">Order Summary</p>
            <ul className="checkout-summary-items">
              {lines.map((line, index) => (
                <li key={`${line.title}-${index}`} className="checkout-summary-row checkout-summary-line">
                  <span>
                    <span className="checkout-summary-line-title">
                      {line.title} × {line.quantity}
                      {line.size ? ` · ${line.size}` : ""}
                    </span>
                    <CustomizationDetails customization={line.customization} />
                  </span>
                  <span>{formatMoney(line.lineTotal, commerce.currency)}</span>
                </li>
              ))}
            </ul>
            <OrderTotals
              subtotal={totals.subtotal}
              shippingFee={totals.shippingFee}
              taxAmount={totals.taxAmount}
              taxLabel={totals.taxLabel}
              total={totals.total}
              currency={commerce.currency}
            />
            <p className="checkout-note">{getFreeShippingNote(commerce)}</p>
            <p className="checkout-note">
              Payment is cash on delivery. Pay the courier in {commerce.currency} when your order arrives. No card is charged online.
            </p>
            <p className="checkout-note">
              Questions before you place the order? Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="checkout-note-link">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
