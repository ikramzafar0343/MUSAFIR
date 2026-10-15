"use client";

import { useActionState } from "react";

import { lookupOrderAction } from "@/features/orders/lookup-actions";
import { OrderSummary } from "@/features/orders/order-summary";
import type { OrderRecord } from "@/types/order";

type State = { error?: string; order?: OrderRecord };

export function OrderLookupForm({ currency }: { currency: string }) {
  const [state, action] = useActionState(async (_prev: State, formData: FormData) => {
    return lookupOrderAction(formData);
  }, {});

  return (
    <div className="space-y-8">
      <form action={action} className="checkout-form space-y-4">
        <label className="auth-field">
          <span className="sr-only">Order number</span>
          <input name="orderNumber" required placeholder="Order number" className="auth-input" />
        </label>
        <label className="auth-field">
          <span className="sr-only">Email</span>
          <input name="email" type="email" required placeholder="Email used at checkout" className="auth-input" />
        </label>
        {state.error ? <p className="auth-form-error">{state.error}</p> : null}
        <button type="submit" className="luxury-button-solid">
          Find order
        </button>
      </form>
      {state.order ? (
        <div className="order-confirmation-card">
          <p className="order-confirmation-fallback-label">Order</p>
          <p className="order-confirmation-fallback-id">{state.order.orderNumber}</p>
          <p className="mt-2 text-sm uppercase tracking-[0.14em]">{state.order.status}</p>
          <OrderSummary order={state.order} currency={state.order.currency || currency} />
        </div>
      ) : null}
    </div>
  );
}
