export const STORE_CURRENCIES = [
  { code: "PKR", label: "Pakistani Rupee", locale: "en-PK", fractionDigits: 0 },
  { code: "USD", label: "US Dollar", locale: "en-US", fractionDigits: 2 },
  { code: "CAD", label: "Canadian Dollar", locale: "en", fractionDigits: 2 },
  { code: "EUR", label: "Euro", locale: "en-IE", fractionDigits: 2 },
  { code: "GBP", label: "British Pound", locale: "en-GB", fractionDigits: 2 },
  { code: "AED", label: "UAE Dirham", locale: "en-AE", fractionDigits: 2 },
  { code: "AUD", label: "Australian Dollar", locale: "en-AU", fractionDigits: 2 },
] as const;

export type StoreCurrencyCode = (typeof STORE_CURRENCIES)[number]["code"];

const CURRENCY_BY_CODE = new Map(STORE_CURRENCIES.map((item) => [item.code, item]));

export const DEFAULT_COMMERCE_SETTINGS = {
  currency: "PKR",
  standardShippingFee: 250,
  freeShippingThreshold: 5000,
  freeShippingEnabled: true,
  taxEnabled: false,
  taxRate: 0,
  taxLabel: "Sales Tax",
} as const;

export type CommerceSettings = {
  readonly currency: string;
  readonly standardShippingFee: number;
  readonly freeShippingThreshold: number;
  readonly freeShippingEnabled: boolean;
  readonly taxEnabled: boolean;
  readonly taxRate: number;
  readonly taxLabel: string;
};

export function isSupportedCurrency(code: string): code is StoreCurrencyCode {
  return CURRENCY_BY_CODE.has(code.toUpperCase() as StoreCurrencyCode);
}

/** Normalize any string to a supported store currency (fallback PKR). */
export function normalizeCurrency(code: string | null | undefined): StoreCurrencyCode {
  const next = String(code ?? "")
    .trim()
    .toUpperCase();
  return isSupportedCurrency(next) ? next : DEFAULT_COMMERCE_SETTINGS.currency;
}

function currencyMeta(code: string) {
  const normalized = normalizeCurrency(code);
  return CURRENCY_BY_CODE.get(normalized)!;
}

/** Symbol only — e.g. `$`, `CA$`, `Rs`. */
export function currencySymbol(code: string): string {
  const meta = currencyMeta(code);
  const parts = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    currencyDisplay: "symbol",
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? meta.code;
}

/** Admin select label: `USD — US Dollar ($)`. */
export function currencyOptionLabel(code: string): string {
  const meta = currencyMeta(code);
  return `${meta.code} — ${meta.label} (${currencySymbol(meta.code)})`;
}

/** Format an amount with the proper currency symbol for the store currency. */
export function formatMoney(amount: number, currency: string = DEFAULT_COMMERCE_SETTINGS.currency): string {
  const meta = currencyMeta(currency);
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    currencyDisplay: "symbol",
    minimumFractionDigits: meta.fractionDigits,
    maximumFractionDigits: meta.fractionDigits,
  }).format(value);
}

export function resolveCommerceSettings(settings: Partial<CommerceSettings> = {}): CommerceSettings {
  const currencyRaw = String(settings.currency ?? "").trim().toUpperCase();
  const fee = Number(settings.standardShippingFee);
  const threshold = Number(settings.freeShippingThreshold);
  // Migrate legacy US-store defaults (USD / $15 / $150) to Pakistan market PKR.
  const legacyUsDefaults =
    currencyRaw === "USD" &&
    (Number.isFinite(fee) ? fee : 15) === 15 &&
    (Number.isFinite(threshold) ? threshold : 150) === 150;

  if (legacyUsDefaults || !currencyRaw) {
    return { ...DEFAULT_COMMERCE_SETTINGS };
  }

  return {
    currency: normalizeCurrency(settings.currency ?? DEFAULT_COMMERCE_SETTINGS.currency),
    standardShippingFee: Number(
      settings.standardShippingFee ?? DEFAULT_COMMERCE_SETTINGS.standardShippingFee,
    ),
    freeShippingThreshold: Number(
      settings.freeShippingThreshold ?? DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold,
    ),
    freeShippingEnabled:
      settings.freeShippingEnabled ?? DEFAULT_COMMERCE_SETTINGS.freeShippingEnabled,
    taxEnabled: settings.taxEnabled ?? DEFAULT_COMMERCE_SETTINGS.taxEnabled,
    taxRate: Number(settings.taxRate ?? DEFAULT_COMMERCE_SETTINGS.taxRate),
    taxLabel: (settings.taxLabel ?? DEFAULT_COMMERCE_SETTINGS.taxLabel).trim() || DEFAULT_COMMERCE_SETTINGS.taxLabel,
  };
}

export function calculateShippingFee(
  subtotal: number,
  settings: CommerceSettings = DEFAULT_COMMERCE_SETTINGS,
): number {
  const commerce = resolveCommerceSettings(settings);
  if (
    commerce.freeShippingEnabled &&
    commerce.freeShippingThreshold > 0 &&
    subtotal >= commerce.freeShippingThreshold
  ) {
    return 0;
  }
  return Math.max(0, commerce.standardShippingFee);
}

export function getFreeShippingNote(settings: CommerceSettings = DEFAULT_COMMERCE_SETTINGS): string {
  const commerce = resolveCommerceSettings(settings);
  if (!commerce.freeShippingEnabled) {
    return "Standard delivery charges apply to all orders.";
  }
  return `Free delivery on orders above ${formatMoney(commerce.freeShippingThreshold, commerce.currency)}.`;
}

export function applyDiscount(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - Math.max(0, discount));
}

export function calculateTaxAmount(
  subtotal: number,
  settings: CommerceSettings = DEFAULT_COMMERCE_SETTINGS,
): number {
  const commerce = resolveCommerceSettings(settings);
  if (!commerce.taxEnabled || commerce.taxRate <= 0) {
    return 0;
  }
  return Math.round((subtotal * commerce.taxRate) / 100);
}

export function calculateOrderTotals(
  subtotal: number,
  settings: CommerceSettings = DEFAULT_COMMERCE_SETTINGS,
  discount = 0,
): {
  subtotal: number;
  discount: number;
  shippingFee: number;
  taxAmount: number;
  taxLabel: string;
  total: number;
} {
  const commerce = resolveCommerceSettings(settings);
  const discounted = applyDiscount(subtotal, discount);
  const shippingFee = calculateShippingFee(discounted, commerce);
  const taxAmount = calculateTaxAmount(discounted, commerce);
  return {
    subtotal,
    discount: Math.max(0, Math.min(subtotal, discount)),
    shippingFee,
    taxAmount,
    taxLabel: commerce.taxLabel,
    total: discounted + shippingFee + taxAmount,
  };
}
