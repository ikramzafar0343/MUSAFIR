import { LegalPage } from "@/features/content/legal-page";
import { TermsAndConditionsCopy } from "@/features/content/musafir-policies";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Terms & Conditions"
      lead="These Terms & Conditions govern your access to musafir.com and any purchases made through our online store."
    >
      <TermsAndConditionsCopy />
    </LegalPage>
  );
}
