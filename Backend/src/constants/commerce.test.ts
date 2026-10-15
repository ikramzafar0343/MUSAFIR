import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateOrderTotals,
  calculateShippingFee,
  calculateTaxAmount,
  DEFAULT_COMMERCE_SETTINGS,
} from "@/constants/commerce";

describe("commerce totals", () => {
  it("applies standard shipping below free threshold", () => {
    const fee = calculateShippingFee(1_000, DEFAULT_COMMERCE_SETTINGS);
    assert.equal(fee, DEFAULT_COMMERCE_SETTINGS.standardShippingFee);
  });

  it("waives shipping at or above free threshold when enabled", () => {
    const threshold = DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold;
    assert.equal(calculateShippingFee(threshold, DEFAULT_COMMERCE_SETTINGS), 0);
    assert.equal(calculateShippingFee(threshold + 1, DEFAULT_COMMERCE_SETTINGS), 0);
  });

  it("computes tax when enabled", () => {
    const settings = { ...DEFAULT_COMMERCE_SETTINGS, taxEnabled: true, taxRate: 5 };
    assert.equal(calculateTaxAmount(10_000, settings), 500);
  });

  it("returns zero tax when disabled", () => {
    const settings = { ...DEFAULT_COMMERCE_SETTINGS, taxEnabled: false, taxRate: 17 };
    assert.equal(calculateTaxAmount(10_000, settings), 0);
  });

  it("sums discount, shipping, and tax into total", () => {
    const settings = {
      ...DEFAULT_COMMERCE_SETTINGS,
      freeShippingEnabled: false,
      standardShippingFee: 250,
      taxEnabled: true,
      taxRate: 10,
    };
    const totals = calculateOrderTotals(2_000, settings, 200);
    assert.equal(totals.subtotal, 2_000);
    assert.equal(totals.discount, 200);
    assert.equal(totals.shippingFee, 250);
    assert.equal(totals.taxAmount, 180);
    assert.equal(totals.total, 2_000 - 200 + 250 + 180);
  });
});
