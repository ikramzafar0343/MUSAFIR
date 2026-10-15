import { formatMoney } from "@/constants/storefront";

export function OrderTotals({
  subtotal,
  shippingFee,
  taxAmount,
  taxLabel,
  total,
  discount = 0,
  currency = "USD",
}: {
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  taxLabel: string;
  total: number;
  discount?: number;
  currency?: string;
}) {
  return (
    <>
      <div className="checkout-summary-rows">
        <p className="checkout-summary-row">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </p>
        {discount > 0 ? (
          <p className="checkout-summary-row">
            <span>Discount</span>
            <span>− {formatMoney(discount, currency)}</span>
          </p>
        ) : null}
        <p className="checkout-summary-row">
          <span>Shipping</span>
          <span>{shippingFee === 0 ? "Free" : formatMoney(shippingFee, currency)}</span>
        </p>
        {taxAmount > 0 ? (
          <p className="checkout-summary-row">
            <span>{taxLabel}</span>
            <span>{formatMoney(taxAmount, currency)}</span>
          </p>
        ) : null}
      </div>
      <p className="checkout-summary-total">
        <span>Total</span>
        <span>{formatMoney(total, currency)}</span>
      </p>
    </>
  );
}
