import Link from "next/link";
import { notFound } from "next/navigation";

import { IconShield, IconTruck } from "@/components/icons/icons";
import { brandName } from "@/constants/brand";
import { formatSupportContactsLine, SUPPORT_CONTACTS, SUPPORT_EMAIL } from "@/constants/site";
import { OrderSummary } from "@/features/orders/order-summary";
import { orderService } from "@/lib/api/orders";
import { readOrderReceipt } from "@/lib/order-receipt-cookie";
import { getSessionUser } from "@/lib/session";
import { getStorefront } from "@/lib/storefront";
import type { OrderRecord } from "@/types/order";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await getSessionUser();
  let order: OrderRecord | null = null;

  if (user) {
    try {
      order = await orderService.getByOrderNumber(orderId, user);
    } catch {
      order = null;
    }
  }

  if (!order) {
    const receipt = await readOrderReceipt();
    if (
      receipt &&
      receipt.orderNumber.toUpperCase() === orderId.toUpperCase()
    ) {
      try {
        order = await orderService.lookupGuest(receipt.orderNumber, receipt.email);
      } catch {
        order = null;
      }
    }
  }

  if (!order) {
    notFound();
  }

  const storefront = await getStorefront();
  const supportDisplay = formatSupportContactsLine();
  const whatsappHref = `https://wa.me/${SUPPORT_CONTACTS[0]!.digits}?text=${encodeURIComponent(
    `Assalam o Alaikum ${brandName}, I just placed order ${order.orderNumber}. Please confirm.`,
  )}`;
  return (
    <div className="order-confirmation-page">
      <div className="mx-auto max-w-[42rem] px-6 md:px-20">
        <header className="order-confirmation-hero">
          <span className="order-confirmation-eyebrow">Order Confirmed</span>
          <h1 className="order-confirmation-title">Thank You For Your Order</h1>
          <p className="order-confirmation-lead">
            We have your order for <span className="order-confirmation-email">{order.email}</span>
            {order.phone ? (
              <>
                {" "}
                and will reach you on <span className="order-confirmation-email">{order.phone}</span>
              </>
            ) : null}
            . Pay the courier in cash when it arrives.
          </p>
          <p className="order-confirmation-lead">
            A confirmation is sent to your WhatsApp and email when messaging is enabled. Need help? WhatsApp us on{" "}
            <a href={whatsappHref} className="order-confirmation-email" target="_blank" rel="noreferrer">
              {supportDisplay}
            </a>
            {" "}
            or email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Order ${order.orderNumber}`)}`} className="order-confirmation-email">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </header>
        <div className="order-confirmation-card">
          <p className="order-confirmation-fallback-label">Order Reference</p>
          <p className="order-confirmation-fallback-id">{order.orderNumber}</p>
          <OrderSummary order={order} currency={order.currency || storefront.commerce.currency} />
        </div>
        <div className="order-confirmation-assurance">
          <div className="order-confirmation-assurance-item">
            <IconTruck />
            <span>Delivery across Pakistan</span>
          </div>
          <div className="order-confirmation-assurance-item">
            <IconShield />
            <span>Cash on delivery</span>
          </div>
        </div>
        <div className="order-confirmation-actions no-print">
          <a href={whatsappHref} className="luxury-button-solid" target="_blank" rel="noreferrer">
            WhatsApp {brandName}
          </a>
          <Link href="/collections/all" className="luxury-button-outline">
            Continue Shopping
          </Link>
          <Link href="/orders/lookup" className="luxury-button-outline">
            Track later
          </Link>
        </div>
      </div>
    </div>
  );
}
