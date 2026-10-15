import { brandName } from "@/constants/brand";
import { PRODUCT_STATUS } from "@/constants/catalog";
import { calculateOrderTotals } from "@/constants/commerce";
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, type OrderStatus,PAYMENT_METHODS } from "@/constants/order-status";
import { ADMIN_ROLES, type Role } from "@/constants/roles";
import { AppError } from "@/lib/app-error";
import { sha256Hex } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import type { LineCustomization } from "@/schemas/order";
import { withTransaction } from "@/server/database/query";
import { idempotencyRepository } from "@/server/database/repositories/idempotency/idempotency.repository";
import { orderRepository } from "@/server/database/repositories/order/order.repository";
import { sendMail } from "@/server/mail/mailer";
import { notifyOrderPlaced, orderEmailText, shopOrderAlertEmail } from "@/server/messaging/whatsapp";
import { productService } from "@/server/services/products/product.service";
import { promoService } from "@/server/services/promo/promo.service";
import { storefrontService } from "@/server/services/storefront/storefront.service";
import type { OrderItemRecord, OrderRecord } from "@/types/order";

function generateOrderNumber(): string {
  return `ZM${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

export class OrderService {
  async getCommerceSettings() {
    return storefrontService.getPublished();
  }

  async checkout(
    payload: {
      email: string;
      phone: string;
      fullName: string;
      address: string;
      city: string;
      postalCode: string;
      paymentMethod: string;
      items: Array<{
        productId: string;
        quantity: number;
        size?: string | null | undefined;
        color?: string | null | undefined;
        colorHex?: string | null | undefined;
        customization?: LineCustomization | null | undefined;
      }>;
      notes?: string | null | undefined;
      promoCode?: string | undefined;
    },
    userId: string | null,
    idempotencyKey: string,
  ): Promise<OrderRecord> {
    const requestHash = sha256Hex(JSON.stringify(payload));
    const existing = await idempotencyRepository.find(idempotencyKey);
    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw AppError.conflict("Idempotency key reused with a different payload");
      }
      return existing.response_body as OrderRecord;
    }

    let createdNew = false;
    const order = await withTransaction(async (client) => {
      const reserved = await idempotencyRepository.reserve(
        {
          keyValue: idempotencyKey,
          requestHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        client,
      );
      if (!reserved.inserted) {
        if (reserved.existing.request_hash !== requestHash) {
          throw AppError.conflict("Idempotency key reused with a different payload");
        }
        return reserved.existing.response_body as OrderRecord;
      }

      const products = await productService.getByIds(
        payload.items.map((item) => item.productId),
        client,
      );
      const productMap = new Map(products.map((product) => [product.id, product]));
      const orderItems: OrderItemRecord[] = [];
      let subtotal = 0;

      for (const item of payload.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw AppError.notFound(`Product not found: ${item.productId}`);
        }
        if (product.status !== PRODUCT_STATUS.PUBLISHED) {
          throw AppError.validation([{ field: "items", message: `${product.title} is not available` }]);
        }
        if (product.stock < item.quantity) {
          throw AppError.validation([{ field: "items", message: `Insufficient stock for ${product.title}` }]);
        }
        const unitPrice = product.effectivePrice;
        subtotal += unitPrice * item.quantity;
        orderItems.push({
          productId: product.id,
          name: product.title,
          sku: product.sku,
          quantity: item.quantity,
          size: item.size ?? null,
          color: item.color ?? null,
          colorHex: item.colorHex ?? null,
          price: unitPrice,
          imageUrl: product.images[0]?.url ?? null,
          customization: item.customization ?? null,
        });
      }

      const commerce = await storefrontService.getPublished();
      let discountAmount = 0;
      let promoCode: string | null = null;
      if (payload.promoCode?.trim()) {
        const preview = await promoService.preview(payload.promoCode, subtotal);
        discountAmount = preview.discount;
        promoCode = preview.code;
      }
      const totals = calculateOrderTotals(subtotal, commerce, discountAmount);

      for (const item of payload.items) {
        await productService.reserveStock(item.productId, item.quantity, client);
      }

      const created = await orderRepository.insert(
        {
          orderNumber: generateOrderNumber(),
          accountId: userId,
          customer: payload.fullName.trim(),
          email: payload.email.toLowerCase().trim(),
          phone: payload.phone.trim(),
          address: payload.address.trim(),
          city: payload.city.trim(),
          postalCode: payload.postalCode.trim(),
          paymentMethod: PAYMENT_METHODS.COD,
          status: ORDER_STATUS.PENDING,
          items: orderItems,
          subtotal,
          shippingFee: totals.shippingFee,
          taxAmount: totals.taxAmount,
          taxRate: commerce.taxEnabled ? commerce.taxRate : 0,
          taxLabel: commerce.taxLabel,
          currency: commerce.currency,
          total: totals.total,
          notes: payload.notes ?? null,
          discountAmount,
          promoCode,
          trackingNumber: null,
          trackingUrl: null,
        },
        client,
      );
      await idempotencyRepository.updateResponse(idempotencyKey, created, client);
      createdNew = true;
      return created;
    });

    if (!createdNew) {
      return order;
    }

    const storefront = await storefrontService.getFull();
    const supportOpts = { supportPhone: storefront.content.supportPhone };
    await sendMail({
      to: order.email,
      replyTo: getEnv().SUPPORT_EMAIL,
      subject: `${brandName} order ${order.orderNumber}`,
      text: orderEmailText(order, getEnv().APP_URL, supportOpts),
    });
    await sendMail({
      to: getEnv().SUPPORT_EMAIL,
      subject: `New ${brandName} order ${order.orderNumber}`,
      text: shopOrderAlertEmail(order, supportOpts),
    });
    await notifyOrderPlaced(order, supportOpts);
    return order;
  }

  async listMine(userId: string, page = 1, limit = 20, cursor?: string) {
    return orderRepository.findPage({ page, limit, cursor, accountId: userId });
  }

  async listAdmin(page = 1, limit = 20, status?: string, cursor?: string) {
    return orderRepository.findPage({
      page,
      limit,
      cursor,
      status: status && status !== "all" ? status : undefined,
    });
  }

  async getByOrderNumber(orderNumber: string, user: { id: string; role: Role } | null) {
    const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));
    if (isAdmin) {
      const order = await orderRepository.findByOrderNumberUnscoped(orderNumber);
      if (!order) {
        throw AppError.notFound("Order not found");
      }
      return order;
    }
    if (!user?.id) {
      throw AppError.notFound("Order not found");
    }
    const order = await orderRepository.findByOrderNumber(orderNumber, user.id);
    if (!order) {
      throw AppError.notFound("Order not found");
    }
    return order;
  }

  async lookupGuest(orderNumber: string, email: string): Promise<OrderRecord> {
    const order = await orderRepository.findByEmailAndNumber(orderNumber, email);
    if (!order) {
      throw AppError.notFound("Order not found");
    }
    return order;
  }

  async updateTracking(id: string, trackingNumber: string, trackingUrl: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw AppError.notFound("Order not found");
    }
    return orderRepository.updateTracking(
      id,
      trackingNumber.trim() || null,
      trackingUrl.trim() || null,
      order.version,
    );
  }

  async summarize() {
    return orderRepository.summarize();
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw AppError.notFound("Order not found");
    }
    const current = order.status as OrderStatus;
    if (!ORDER_STATUS_TRANSITIONS[current].includes(status)) {
      throw AppError.validation([{ field: "status", message: "Invalid status transition" }]);
    }
    return orderRepository.updateStatus(
      id,
      status,
      order.version,
      status === ORDER_STATUS.CANCELLED ? new Date() : null,
    );
  }

  async remove(id: string): Promise<void> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw AppError.notFound("Order not found");
    }
    const shouldRestoreStock =
      order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PROCESSING;
    await withTransaction(async (client) => {
      if (shouldRestoreStock) {
        for (const item of order.items) {
          await productService.releaseStock(item.productId, item.quantity, client);
        }
      }
      const deleted = await orderRepository.softDeleteById(id, client);
      if (!deleted) {
        throw AppError.notFound("Order not found");
      }
    });
  }
}

export const orderService = new OrderService();
