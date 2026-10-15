import { brandName } from "@/constants/brand";
import { DEFAULT_COMMERCE_SETTINGS } from "@/constants/commerce";
import { formatSupportContactsLine, SUPPORT_EMAIL, toWhatsAppDigits } from "@/constants/site";
import { formatMoney } from "@/constants/storefront";
import type { LineCustomization } from "@/schemas/order";

type OrderWhatsAppInput = {
  orderNumber: string;
  customer: string;
  phone: string;
  items: readonly {
    name: string;
    quantity: number;
    size?: string | null;
    customization?: LineCustomization | null;
  }[];
  total: number;
  currency?: string;
  supportPhone?: string;
};

export function customerOrderWhatsAppMessage(order: OrderWhatsAppInput): string {
  const lines = order.items
    .map((item) => {
      const size = item.size ? ` (${item.size})` : "";
      const base = `• ${item.name} × ${item.quantity}${size}`;
      const custom = item.customization;
      if (!custom?.name) {
        return base;
      }
      const bits = [`Name: ${custom.name}`];
      if (custom.color) {
        bits.push(`Color: ${custom.color}`);
      }
      if (custom.logoUrl) {
        bits.push("Logo attached");
      }
      if (custom.notes) {
        bits.push(`Notes: ${custom.notes}`);
      }
      return `${base}\n  ${bits.join(" · ")}`;
    })
    .join("\n");
  const money = formatMoney(order.total, order.currency ?? DEFAULT_COMMERCE_SETTINGS.currency);
  const contacts = formatSupportContactsLine();
  return [
    `Assalam o Alaikum ${order.customer},`,
    ``,
    `Thank you for shopping with ${brandName}.`,
    `Your order ${order.orderNumber} is confirmed.`,
    ``,
    lines,
    ``,
    `Total: ${money}`,
    `Payment: Cash on delivery`,
    `Delivery: Across Pakistan (typically 3–5 working days)`,
    ``,
    `Questions? WhatsApp us on ${contacts} or email ${SUPPORT_EMAIL}.`,
    ``,
    `— ${brandName}`,
  ].join("\n");
}

/** Opens YOUR WhatsApp with this message ready to send to the customer (one tap). */
export function customerWhatsAppSendUrl(order: OrderWhatsAppInput): string | null {
  const digits = toWhatsAppDigits(order.phone);
  if (!digits) {
    return null;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(customerOrderWhatsAppMessage(order))}`;
}
