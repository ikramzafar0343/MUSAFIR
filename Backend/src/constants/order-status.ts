export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  processing: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  shipped: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  delivered: [],
  cancelled: [],
};

export const PAYMENT_METHODS = {
  COD: "cod",
  ONLINE: "online",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
