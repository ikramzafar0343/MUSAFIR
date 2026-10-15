import { LegalPage } from "@/features/content/legal-page";
import { OrderLookupForm } from "@/features/orders/order-lookup-form";
import { getStorefront } from "@/lib/storefront";

export default async function OrderLookupPage() {
  const storefront = await getStorefront();
  return (
    <LegalPage
      eyebrow="Orders"
      title="Find your order"
      lead="Guests can look up an order with the email used at checkout and the order number from your confirmation."
    >
      <OrderLookupForm currency={storefront.commerce.currency} />
    </LegalPage>
  );
}
