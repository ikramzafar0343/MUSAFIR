import { getFreeShippingNote } from "@/constants/commerce";
import { SUPPORT_EMAIL } from "@/constants/site";
import { LegalPage } from "@/features/content/legal-page";
import { getStorefront } from "@/lib/storefront";

export default async function ShippingPage() {
  const storefront = await getStorefront();
  return (
    <LegalPage
      eyebrow="Policies"
      title="Shipping & Delivery"
      lead="Delivery across Pakistan. Cash on delivery at your door."
    >
      <p>
        We deliver across Pakistan. Transit times vary by city and courier — typically a few working days after your
        order is confirmed. You will receive an order reference after checkout so you can follow up with client care at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="info-page-link">
          {SUPPORT_EMAIL}
        </a>
        {" "}
        or WhatsApp if needed.
      </p>
      <p>{getFreeShippingNote(storefront.commerce)}</p>
      <p>
        Payment is cash on delivery. Please keep the order total ready when your parcel arrives.
      </p>
    </LegalPage>
  );
}
