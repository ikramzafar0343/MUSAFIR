import type { ReactNode } from "react";

import { SmoothScroll } from "@/features/motion/smooth-scroll";
import { SiteFooter } from "@/features/navigation/site-footer";
import { SiteHeader } from "@/features/navigation/site-header";
import { resolveAndPruneCart } from "@/lib/resolve-cart";
import { getStorefront } from "@/lib/storefront";
import { readWishlist } from "@/lib/wishlist-cookie";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [cart, wishlist, storefront] = await Promise.all([
    resolveAndPruneCart(),
    readWishlist(),
    getStorefront(),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <SmoothScroll />
      <SiteHeader
        cartCount={cart.count}
        wishlistCount={wishlist.ids.length}
        megaMenus={storefront.content.megaMenus}
        navLinks={storefront.content.navLinks}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter content={storefront.content} />
    </div>
  );
}
