import nextDynamic from "next/dynamic";

import { HOME_TESTIMONIALS } from "@/constants/site";
import { visibleShopCategories } from "@/constants/storefront";
import { BestSellers } from "@/features/catalog/best-sellers";
import { HeroHome } from "@/features/catalog/hero-home";
import { mergeUniqueProducts, resolveBestSellers } from "@/features/catalog/resolve-best-sellers";
import { RitualFinder } from "@/features/catalog/ritual-finder";
import { ShopByCategory } from "@/features/catalog/shop-by-category";
import { HomeMotion } from "@/features/motion/home-motion";
import { productService } from "@/lib/api/products";
import { getStorefront } from "@/lib/storefront";
import { readWishlist } from "@/lib/wishlist-cookie";

/** CMS-driven homepage — never serve a stale published storefront snapshot. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Below-the-fold chunks hydrate after the hero — keeps cold navigations snappy. */
const Features = nextDynamic(() => import("@/features/catalog/features").then((m) => m.Features));
const ProductHighlights = nextDynamic(() =>
  import("@/features/catalog/product-highlights").then((m) => m.ProductHighlights),
);
const CraftedForEveryRide = nextDynamic(() =>
  import("@/features/catalog/crafted-for-every-ride").then((m) => m.CraftedForEveryRide),
);
const CustomYourTack = nextDynamic(() =>
  import("@/features/catalog/custom-your-tack").then((m) => m.CustomYourTack),
);
const BrandStory = nextDynamic(() => import("@/features/catalog/brand-story").then((m) => m.BrandStory));
const SeenInTheSaddle = nextDynamic(() =>
  import("@/features/catalog/seen-in-the-saddle").then((m) => m.SeenInTheSaddle),
);
const HomeTestimonials = nextDynamic(() =>
  import("@/features/catalog/home-testimonials").then((m) => m.HomeTestimonials),
);
const SizeFitGuide = nextDynamic(() =>
  import("@/features/catalog/size-fit-guide").then((m) => m.SizeFitGuide),
);
const HomeFaq = nextDynamic(() => import("@/features/catalog/home-faq").then((m) => m.HomeFaq));
const GlowStats = nextDynamic(() => import("@/features/catalog/glow-stats").then((m) => m.GlowStats));

export default async function HomePage() {
  const [storefront, wishlist] = await Promise.all([getStorefront(), readWishlist()]);
  let products = await productService.getBySkus(storefront.content.bestSellerSkus);
  if (products.length < 3) {
    const flagged = await productService.list({ bestSeller: true, limit: 12 });
    products = mergeUniqueProducts(products, flagged.products);
  }
  if (products.length < 3) {
    const ensured = await productService.ensureBestSellers().catch(() => []);
    products = mergeUniqueProducts(products, ensured);
  }
  const bestSellers = resolveBestSellers(products, wishlist.ids, storefront.content.bestSellerColors);

  return (
    <div className="home-flow">
      <HomeMotion />
      <HeroHome content={storefront.content} />
      <RitualFinder />
      <ShopByCategory categories={visibleShopCategories(storefront.content)} />
      <BestSellers items={bestSellers} currency={storefront.commerce.currency} />
      <Features content={storefront.content} />
      <ProductHighlights image={storefront.content.productHighlightsImage} />
      {storefront.content.disciplinesSection.items.length > 0 &&
      storefront.content.disciplinesSection.title ? (
        <CraftedForEveryRide content={storefront.content.disciplinesSection} />
      ) : null}
      {storefront.content.customTack.options.length > 0 && storefront.content.customTack.title ? (
        <CustomYourTack content={storefront.content.customTack} />
      ) : null}
      <BrandStory content={storefront.content} />
      {storefront.content.riderGallery.items.length > 0 ? (
        <SeenInTheSaddle content={storefront.content.riderGallery} />
      ) : null}
      {HOME_TESTIMONIALS.length > 0 ? <HomeTestimonials /> : null}
      <SizeFitGuide />
      <HomeFaq content={storefront.content} />
      <GlowStats image={storefront.content.glowStatsImage} />
    </div>
  );
}
