import type { LineCustomization } from "@/schemas/order";

export type OrderItemRecord = {
  readonly productId: string;
  readonly name: string;
  readonly sku: string;
  readonly quantity: number;
  readonly size: string | null;
  readonly color: string | null;
  readonly colorHex: string | null;
  readonly price: number;
  readonly imageUrl: string | null;
  readonly customization: LineCustomization | null;
};

export type OrderRecord = {
  readonly id: string;
  readonly _id: string;
  readonly orderNumber: string;
  readonly userId: string | null;
  readonly customer: string;
  readonly email: string;
  readonly phone: string;
  readonly shipping: {
    readonly address: string;
    readonly city: string;
    readonly postalCode: string;
  };
  readonly paymentMethod: string;
  readonly status: string;
  readonly items: readonly OrderItemRecord[];
  readonly subtotal: number;
  readonly shippingFee: number;
  readonly taxAmount: number;
  readonly taxRate: number;
  readonly taxLabel: string;
  readonly currency: string;
  readonly total: number;
  readonly discountAmount: number;
  readonly promoCode: string | null;
  readonly trackingNumber: string | null;
  readonly trackingUrl: string | null;
  readonly notes: string | null;
  readonly cancelledAt: string | null;
  readonly cancellationReason: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};
