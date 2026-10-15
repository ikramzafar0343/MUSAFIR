import { brandName } from "@/constants/brand";
import {
  formatSupportContactsLine,
  formatSupportPhoneDisplay,
  SUPPORT_CONTACTS,
  SUPPORT_EMAIL,
  toWhatsAppDigits,
} from "@/constants/site";
import { formatMoney } from "@/constants/storefront";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { LineCustomization } from "@/schemas/order";
import type { OrderItemRecord, OrderRecord } from "@/types/order";

type SupportPhoneOpts = { supportPhone?: string | null };

function formatCustomization(customization: LineCustomization | null | undefined): string | null {
  if (!customization?.name) {
    return null;
  }
  const bits = [`Name: ${customization.name}`];
  if (customization.color) {
    bits.push(`Color: ${customization.color}`);
  }
  if (customization.logoUrl) {
    bits.push("Logo attached");
  }
  if (customization.notes) {
    bits.push(`Notes: ${customization.notes}`);
  }
  return bits.join(" · ");
}

function formatOrderItemLine(item: OrderItemRecord, prefix = "• "): string {
  const size = item.size ? ` (${item.size})` : "";
  const line = `${prefix}${item.name} × ${item.quantity}${size}`;
  const custom = formatCustomization(item.customization);
  return custom ? `${line}\n  ${custom}` : line;
}

function customerOrderMessage(order: OrderRecord, _opts: SupportPhoneOpts = {}): string {
  const lines = order.items.map((item) => formatOrderItemLine(item)).join("\n");
  const contacts = formatSupportContactsLine();
  return [
    `Assalam o Alaikum ${order.customer},`,
    ``,
    `Thank you for shopping with ${brandName}.`,
    `Your order ${order.orderNumber} is confirmed.`,
    ``,
    lines,
    ``,
    `Total: ${formatMoney(order.total, order.currency)}`,
    `Payment: Cash on delivery`,
    `Delivery: 3–5 working days`,
    ``,
    `We will call or WhatsApp you on ${order.phone} if we need anything.`,
    `Questions? Message us on WhatsApp ${contacts} or email ${SUPPORT_EMAIL}.`,
    ``,
    `— ${brandName}`,
  ].join("\n");
}

/** One-tap link: opens WhatsApp on your phone with the customer confirmation ready to send. */
export function customerWhatsAppSendUrl(order: OrderRecord, opts: SupportPhoneOpts = {}): string | null {
  const digits = toWhatsAppDigits(order.phone);
  if (!digits) {
    return null;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(customerOrderMessage(order, opts))}`;
}

export function shopOrderAlertEmail(order: OrderRecord, opts: SupportPhoneOpts = {}): string {
  const lines = order.items.map((item) => formatOrderItemLine(item, "")).join("\n");
  const sendUrl = customerWhatsAppSendUrl(order, opts);
  const display = formatSupportPhoneDisplay(opts.supportPhone);
  return [
    `New COD order ${order.orderNumber}`,
    ``,
    `Customer: ${order.customer}`,
    `Phone: ${order.phone}`,
    `Email: ${order.email}`,
    `Address: ${order.shipping.address}, ${order.shipping.city} ${order.shipping.postalCode}`,
    ``,
    lines,
    ``,
    `Total: ${formatMoney(order.total, order.currency)}`,
    ``,
    sendUrl
      ? `Tap to WhatsApp the customer confirmation from your phone (${display}):\n${sendUrl}`
      : `Customer phone could not be converted for WhatsApp.`,
    ``,
    `Admin: open the order in /admin/orders/${order.orderNumber}`,
  ].join("\n");
}

function businessOrderMessage(order: OrderRecord): string {
  const lines = order.items.map((item) => formatOrderItemLine(item)).join("\n");
  return [
    `🛒 New ${brandName} order`,
    `Order: ${order.orderNumber}`,
    `Customer: ${order.customer}`,
    `Phone: ${order.phone}`,
    `Email: ${order.email}`,
    `Address: ${order.shipping.address}, ${order.shipping.city} ${order.shipping.postalCode}`,
    ``,
    lines,
    ``,
    `Total: ${formatMoney(order.total, order.currency)} (COD)`,
  ].join("\n");
}

async function sendViaUltraMsg(toDigits: string, body: string): Promise<boolean> {
  const env = getEnv();
  if (!env.ULTRAMSG_INSTANCE_ID || !env.ULTRAMSG_TOKEN) {
    return false;
  }
  const url = `https://api.ultramsg.com/${env.ULTRAMSG_INSTANCE_ID}/messages/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: env.ULTRAMSG_TOKEN,
      to: `+${toDigits}`,
      body,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    logger.error({ status: response.status, detail }, "UltraMsg WhatsApp send failed");
    return false;
  }
  return true;
}

async function sendViaMeta(toDigits: string, body: string): Promise<boolean> {
  const env = getEnv();
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return false;
  }
  const version = env.WHATSAPP_API_VERSION || "v21.0";
  const url = `https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toDigits,
      type: "text",
      text: { preview_url: false, body },
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    logger.error({ status: response.status, detail }, "Meta WhatsApp send failed");
    return false;
  }
  return true;
}

export async function sendWhatsAppText(toPhone: string, body: string): Promise<boolean> {
  const digits = toWhatsAppDigits(toPhone);
  if (!digits) {
    logger.warn({ toPhone }, "Skipping WhatsApp: invalid phone");
    return false;
  }
  try {
    const env = getEnv();
    if (env.WHATSAPP_PROVIDER === "meta") {
      return await sendViaMeta(digits, body);
    }
    if (env.WHATSAPP_PROVIDER === "ultramsg") {
      return await sendViaUltraMsg(digits, body);
    }
    // Auto-detect whichever credentials are present
    if (env.ULTRAMSG_INSTANCE_ID && env.ULTRAMSG_TOKEN) {
      return await sendViaUltraMsg(digits, body);
    }
    if (env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
      return await sendViaMeta(digits, body);
    }
    logger.warn("WhatsApp not configured; set ULTRAMSG_* or WHATSAPP_* env vars");
    return false;
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : "whatsapp failed" }, "Unable to send WhatsApp");
    return false;
  }
}

/** Notify customer + shop WhatsApp after a successful order. Never throws. */
export async function notifyOrderPlaced(order: OrderRecord, opts: SupportPhoneOpts = {}): Promise<void> {
  const shopDigits = SUPPORT_CONTACTS[0]!.digits;
  const customerBody = customerOrderMessage(order, opts);
  const businessBody = businessOrderMessage(order);
  const customerOk = await sendWhatsAppText(order.phone, customerBody);
  const businessOk = await sendWhatsAppText(shopDigits, businessBody);
  logger.info(
    { orderNumber: order.orderNumber, customerOk, businessOk, shopDigits },
    "Order WhatsApp notifications attempted",
  );
}

export function orderEmailText(order: OrderRecord, appUrl: string, _opts: SupportPhoneOpts = {}): string {
  const lines = order.items.map((item) => formatOrderItemLine(item, "")).join("\n");
  const contacts = formatSupportContactsLine();
  return [
    `Assalam o Alaikum ${order.customer},`,
    ``,
    `Thank you for your ${brandName} order ${order.orderNumber}.`,
    ``,
    lines,
    ``,
    `Total: ${formatMoney(order.total, order.currency)}`,
    `Payment: Cash on delivery`,
    `We will deliver within 3–5 working days.`,
    ``,
    `Need help? Call or WhatsApp ${contacts}, or email ${SUPPORT_EMAIL}.`,
    `WhatsApp: https://wa.me/${SUPPORT_CONTACTS[0]!.digits}`,
    ``,
    `Track a guest order: ${appUrl.replace(/\/$/, "")}/orders/lookup`,
    `(use this email and order number)`,
    ``,
    `— ${brandName}`,
  ].join("\n");
}
