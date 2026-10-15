import { LegalPage } from "@/features/content/legal-page";
import { ReturnRefundPolicyCopy } from "@/features/content/musafir-policies";

export default function ReturnsPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Return & Refund Policy"
      lead="Eligible products may be returned within 30 days of the date you receive your order."
    >
      <ReturnRefundPolicyCopy />
    </LegalPage>
  );
}
