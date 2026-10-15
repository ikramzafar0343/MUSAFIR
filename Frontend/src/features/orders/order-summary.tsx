import { formatMoney } from "@/constants/storefront";
import { OrderTotals } from "@/features/checkout/order-totals";
import { PrintButton } from "@/features/orders/print-button";
import type { OrderRecord } from "@/types/order";

export function OrderSummary({
  order,
  currency,
}: {
  order: OrderRecord;
  currency?: string;
}) {
  const moneyCurrency = order.currency || currency || "USD";
  return (
    <div className="print-receipt">
      <ul className="mt-6 space-y-2 text-sm">
        {order.items.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            {item.name} × {item.quantity} — {formatMoney(item.price, moneyCurrency)}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <OrderTotals
          subtotal={order.subtotal}
          discount={order.discountAmount}
          shippingFee={order.shippingFee}
          taxAmount={order.taxAmount}
          taxLabel={order.taxLabel}
          total={order.total}
          currency={moneyCurrency}
        />
      </div>
      {order.promoCode ? <p className="mt-3 text-sm text-text-sub">Promo: {order.promoCode}</p> : null}
      <p className="mt-3 text-sm text-text-sub">
        {order.shipping.address}, {order.shipping.city} {order.shipping.postalCode}
      </p>
      <p className="mt-2 text-sm text-text-sub">Cash on delivery</p>
      {order.trackingNumber ? (
        <p className="mt-3 text-sm">
          Tracking: {order.trackingUrl ? <a href={order.trackingUrl} className="underline-offset-4 hover:underline">{order.trackingNumber}</a> : order.trackingNumber}
        </p>
      ) : null}
      <div className="mt-6 no-print">
        <PrintButton />
      </div>
    </div>
  );
}
