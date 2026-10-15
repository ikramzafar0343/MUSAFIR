"use client";

import { useActionState, useState } from "react";

import { DISCOUNT_TYPES } from "@/constants/catalog";
import { createPromoAction } from "@/features/admin/ops-actions";

export function PromoCreateForm({ currency }: { currency: string }) {
  const [state, action] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createPromoAction(formData),
    {},
  );
  const [discountType, setDiscountType] = useState<string>(DISCOUNT_TYPES.PERCENTAGE);

  return (
    <form action={action} className="admin-product-card admin-promo-create" noValidate>
      <h2 className="admin-product-card-title">New code</h2>
      <p className="admin-product-kicker admin-storefront-lead">
        Shoppers enter this at checkout. Codes are saved in uppercase.
      </p>
      {state.error ? (
        <p className="admin-product-error admin-storefront-lead" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="admin-product-fields">
        <div className="admin-product-field">
          <label className="admin-product-label" htmlFor="promo-code">
            Code
          </label>
          <input
            id="promo-code"
            name="code"
            className="admin-product-soft"
            placeholder="RIDE10"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>
        <div className="admin-product-field">
          <label className="admin-product-label" htmlFor="promo-type">
            Type
          </label>
          <select
            id="promo-type"
            name="discountType"
            className="admin-product-soft admin-product-select"
            value={discountType}
            onChange={(event) => setDiscountType(event.target.value)}
          >
            <option value={DISCOUNT_TYPES.PERCENTAGE}>Percentage</option>
            <option value={DISCOUNT_TYPES.FIXED}>Fixed amount</option>
          </select>
        </div>
        <div className="admin-product-field">
          <label className="admin-product-label" htmlFor="promo-amount">
            Amount
          </label>
          <span className="admin-product-affix">
            {discountType === DISCOUNT_TYPES.FIXED ? (
              <span className="admin-product-affix-label">{currency}</span>
            ) : null}
            <input
              id="promo-amount"
              name="amount"
              type="number"
              min="1"
              max={discountType === DISCOUNT_TYPES.PERCENTAGE ? 100 : undefined}
              step="1"
              inputMode="numeric"
              className="admin-product-soft"
              placeholder={discountType === DISCOUNT_TYPES.PERCENTAGE ? "10" : "500"}
              required
            />
            {discountType === DISCOUNT_TYPES.PERCENTAGE ? (
              <span className="admin-product-affix-label">%</span>
            ) : null}
          </span>
        </div>
        <div className="admin-product-field">
          <label className="admin-product-label" htmlFor="promo-min">
            Minimum subtotal
          </label>
          <span className="admin-product-affix">
            <span className="admin-product-affix-label">{currency}</span>
            <input
              id="promo-min"
              name="minSubtotal"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              className="admin-product-soft"
              defaultValue="0"
            />
          </span>
        </div>
      </div>
      <div className="admin-product-toolbar-actions">
        <button type="submit" className="admin-product-cta">
          Create code
        </button>
      </div>
    </form>
  );
}
