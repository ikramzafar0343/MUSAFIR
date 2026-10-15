import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PAYMENT_METHODS } from "@/constants/order-status";
import { checkoutSchema } from "@/schemas/order";
import { createProductSchema } from "@/schemas/product";

const productId = "11111111-1111-4111-8111-111111111111";

describe("security negative inputs", () => {
  it("strips / rejects script tags in checkout name", () => {
    const parsed = checkoutSchema.safeParse({
      email: "safe@example.com",
      phone: "03001234567",
      fullName: "<script>alert(1)</script>",
      address: "12 Test Road",
      city: "Lahore",
      postalCode: "54000",
      paymentMethod: PAYMENT_METHODS.COD,
      items: [{ productId, quantity: 1 }],
    });
    assert.equal(parsed.success, false);
  });

  it("rejects oversized product title", () => {
    const parsed = createProductSchema.safeParse({
      title: "x".repeat(5000),
      sku: "SKU-XSS",
      price: 1000,
      stock: 1,
      status: "draft",
      categories: ["shirts"],
    });
    assert.equal(parsed.success, false);
  });

  it("rejects empty categories on create", () => {
    const parsed = createProductSchema.safeParse({
      title: "Clean Shirt",
      sku: "SKU-OK",
      price: 1000,
      stock: 1,
      status: "draft",
      categories: [],
    });
    assert.equal(parsed.success, false);
  });
});

