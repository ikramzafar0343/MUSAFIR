import { brandName } from "@/constants/brand";
import { SUPPORT_EMAIL } from "@/constants/site";
import { LegalPage } from "@/features/content/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Privacy Policy"
      lead={`${brandName} collects only what we need to fulfil orders and answer your questions.`}
    >
      <p>
        When you shop or write to us we may store your name, email, phone, delivery address, and order history. We use
        this to process cash-on-delivery orders, prevent fraud, and respond to client care.
      </p>
      <p>
        Session, bag, and wishlist cookies stay on your device so the storefront can remember your visit. We do not sell
        personal data. Access is limited to the people who operate this shop.
      </p>
      <p>
        To ask what we hold, or to request a correction, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="info-page-link">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </LegalPage>
  );
}
