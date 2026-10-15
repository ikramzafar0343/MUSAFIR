import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PAYMENT_METHODS } from "@/constants/order-status";
import { checkoutSchema } from "@/schemas/order";

const productId = "11111111-1111-4111-8111-111111111111";

function baseCheckout(overrides: Record<string, unknown> = {}) {
  return {
    email: "rider@example.com",
    phone: "03001234567",
    fullName: "Ali Khan",
    address: "12 MM Alam Road",
    city: "Lahore",
    postalCode: "54000",
    paymentMethod: PAYMENT_METHODS.COD,
    items: [{ productId, quantity: 1 }],
    ...overrides,
  };
}

describe("checkoutSchema", () => {
  it("accepts Pakistan COD checkout", () => {
    const parsed = checkoutSchema.safeParse(baseCheckout());
    assert.equal(parsed.success, true);
  });

  it("rejects online payment method while COD-only", () => {
    const parsed = checkoutSchema.safeParse(baseCheckout({ paymentMethod: PAYMENT_METHODS.ONLINE }));
    assert.equal(parsed.success, false);
  });

  it("rejects invalid Pakistan postal codes", () => {
    const parsed = checkoutSchema.safeParse(baseCheckout({ postalCode: "NA" }));
    assert.equal(parsed.success, false);
  });

  it("accepts 5-digit Pakistan postal codes", () => {
    const parsed = checkoutSchema.safeParse(baseCheckout({ postalCode: "44000" }));
    assert.equal(parsed.success, true);
  });

  it("rejects XSS-like name characters via clean + refine", () => {
    const parsed = checkoutSchema.safeParse(baseCheckout({ fullName: "<script>alert(1)</script>" }));
    assert.equal(parsed.success, false);
  });

  it("requires at least one line item", () => {
    const parsed = checkoutSchema.safeParse(baseCheckout({ items: [] }));
    assert.equal(parsed.success, false);
  });
});
