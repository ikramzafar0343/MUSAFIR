import { HomeFaq } from "@/features/catalog/home-faq";
import { getStorefront } from "@/lib/storefront";

export default async function FaqPage() {
  const storefront = await getStorefront();
  return (
    <div className="bg-brand-bg">
      <HomeFaq content={storefront.content} />
    </div>
  );
}
