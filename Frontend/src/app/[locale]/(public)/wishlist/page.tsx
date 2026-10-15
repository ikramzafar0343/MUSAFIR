import Link from "next/link";

import { brandName } from "@/constants/brand";
import { toCatalogProduct } from "@/features/catalog/map-product";
import { ProductGrid } from "@/features/catalog/product-grid";
import { productService } from "@/lib/api/products";
import { getStorefront } from "@/lib/storefront";
import { readWishlist } from "@/lib/wishlist-cookie";

export default async function WishlistPage() {
  const wishlist = await readWishlist();
  const [productsRaw, storefront] = await Promise.all([
    productService.getByIds(wishlist.ids),
    getStorefront(),
  ]);
  const products = productsRaw.map((item) =>
    toCatalogProduct(item, { hotSkus: storefront.content.bestSellerSkus }),
  );
  const empty = products.length === 0;

  return (
    <div className="wishlist-page">
      <div className="mx-auto max-w-[1600px] px-6 md:px-20">
        {empty ? (
          <div className="wishlist-empty">
            <span className="wishlist-eyebrow">Your Collection</span>
            <h1 className="wishlist-title">Saved Pieces You Love</h1>
            <p className="wishlist-description">
              Keep the {brandName} pieces you want to return to — coats, shirts, trousers, shoes and more — in one calm
              favorites list.
            </p>
            <div className="wishlist-actions">
              <Link href="/collections/all" className="luxury-button-solid">
                Continue Shopping
              </Link>
              <Link href="/collections/new" className="luxury-button-outline">
                Explore New Arrivals
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="wishlist-header">
              <span className="wishlist-eyebrow">Your Collection</span>
              <h1 className="wishlist-title wishlist-title--compact">Saved Pieces You Love</h1>
              <p className="wishlist-description">
                {products.length} {products.length === 1 ? "product" : "products"} saved to your wishlist.
              </p>
            </div>
            <div className="wishlist-grid-wrap">
              <ProductGrid products={products} wishlistIds={wishlist.ids} columns={4} currency={storefront.commerce.currency} tileColors={storefront.content.productCardColors} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
