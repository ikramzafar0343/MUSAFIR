import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PAYMENT_METHODS } from "@/constants/order-status";
import { checkoutSchema } from "@/schemas/order";

const productId = "11111111-1111-4111-8111-111111111111";

describe("frontend checkoutSchema", () => {
  it("only allows COD payment method", () => {
    const ok = checkoutSchema.safeParse({
      email: "a@b.com",
      phone: "03001234567",
      fullName: "Sara Ali",
      address: "45 Gulberg III",
      city: "Lahore",
      postalCode: "54000",
      paymentMethod: PAYMENT_METHODS.COD,
      items: [{ productId, quantity: 1 }],
    });
    assert.equal(ok.success, true);

    const online = checkoutSchema.safeParse({
      email: "a@b.com",
      phone: "03001234567",
      fullName: "Sara Ali",
      address: "45 Gulberg III",
      city: "Lahore",
      postalCode: "54000",
      paymentMethod: "online",
      items: [{ productId, quantity: 1 }],
    });
    assert.equal(online.success, false);
  });
});
