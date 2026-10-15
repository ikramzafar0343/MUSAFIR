import Image from "next/image";
import Link from "next/link";

import { IconHeart, IconMinus, IconPlus, IconTrash } from "@/components/icons/icons";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { CATEGORY_LABELS } from "@/constants/catalog";
import { calculateOrderTotals, getFreeShippingNote } from "@/constants/commerce";
import { formatMoney } from "@/constants/storefront";
import { moveCartItemToWishlistAction,removeFromCartAction, updateCartQuantityAction } from "@/features/cart/actions";
import { CartLineHiddenFields } from "@/features/cart/cart-line-fields";
import { CustomizationDetails } from "@/features/catalog/customization-details";
import { OrderTotals } from "@/features/checkout/order-totals";
import { orderService } from "@/lib/api/orders";
import { resolvePublicAssetSrc } from "@/lib/public-assets";
import { resolveAndPruneCart } from "@/lib/resolve-cart";

export default async function CartPage() {
  const [{ items, products }, commerce] = await Promise.all([
    resolveAndPruneCart(),
    orderService.getCommerceSettings(),
  ]);
  const lines = items
    .map((item) => {
      const product = products.get(item.productId);
      if (!product) {
        return null;
      }
      const price = Number(product.effectivePrice ?? product.price ?? 0);
      return { ...item, product, lineTotal: price * item.quantity };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totals = calculateOrderTotals(subtotal, commerce);
  const empty = lines.length === 0;

  return (
    <div className={`cart-page${empty ? " cart-page--empty" : ""}`}>
      <div className="mx-auto max-w-[1600px] px-6 md:px-20">
        {empty ? (
          <div className="cart-empty">
            <span className="section-intro-eyebrow">Shopping Bag</span>
            <h1 className="cart-empty-title">Your Bag Is Empty</h1>
            <p className="cart-empty-description">
              Discover coats, blazers, formal shirts, trousers, footwear and matching sets — then add your favourites to begin checkout.
            </p>
            <div className="cart-empty-actions">
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
            <header className="section-intro cart-page-intro">
              <span className="section-intro-eyebrow">Shopping Bag</span>
              <h1 className="section-intro-title">Your Selection</h1>
              <p className="section-intro-description">Review your bag before checkout.</p>
            </header>
            <div className="cart-layout">
              <div className="cart-items-list">
                {lines.map((line) => {
                  const title = String(line.product?.title ?? "Product");
                  const image = line.product?.images?.[0]?.url;
                  const category = String(line.product?.category ?? "all");
                  return (
                    <article key={`${line.productId}-${line.size ?? ""}-${line.color ?? ""}-${line.customization?.name ?? ""}-${line.customization?.logoUrl ?? ""}`} className="cart-item-card">
                      <Link href={`/product/${line.productId}`} className="cart-item-media">
                        {image ? (
                          <Image
                            src={resolvePublicAssetSrc(image)}
                            alt={title}
                            fill
                            className="cart-item-image"
                            sizes="160px"
                            unoptimized
                          />
                        ) : null}
                      </Link>
                      <div className="cart-item-body">
                        <div className="cart-item-top">
                          <div className="cart-item-details">
                            <span className="cart-item-category">{(CATEGORY_LABELS[category] ?? "Collection").toUpperCase()}</span>
                            <Link href={`/product/${line.productId}`} className="cart-item-name">
                              {title}
                            </Link>
                            <div className="cart-item-meta">
                              {line.color ? <span className="cart-item-color">{line.color}</span> : null}
                              {line.size ? <span className="cart-item-size">Size: {line.size}</span> : null}
                            </div>
                            <CustomizationDetails customization={line.customization} />
                          </div>
                          <div className="cart-item-side">
                            <div className="cart-item-qty" aria-label="Quantity">
                              <form action={updateCartQuantityAction}>
                                <CartLineHiddenFields
                                  productId={line.productId}
                                  size={line.size}
                                  color={line.color}
                                  customization={line.customization}
                                  quantity={line.quantity - 1}
                                />
                                <button type="submit" className="cart-item-qty-btn" aria-label="Decrease quantity">
                                  <IconMinus />
                                </button>
                              </form>
                              <span className="cart-item-qty-value">{line.quantity}</span>
                              <form action={updateCartQuantityAction}>
                                <CartLineHiddenFields
                                  productId={line.productId}
                                  size={line.size}
                                  color={line.color}
                                  customization={line.customization}
                                  quantity={line.quantity + 1}
                                />
                                <button type="submit" className="cart-item-qty-btn" aria-label="Increase quantity">
                                  <IconPlus />
                                </button>
                              </form>
                            </div>
                            <p className="cart-item-price">{formatMoney(line.lineTotal, commerce.currency)}</p>
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <form action={moveCartItemToWishlistAction}>
                            <CartLineHiddenFields
                              productId={line.productId}
                              size={line.size}
                              color={line.color}
                              customization={line.customization}
                            />
                            <ConfirmSubmit
                              className="cart-item-link"
                              message="Move this item to your wishlist?"
                              label={
                                <>
                                  <IconHeart />
                                  <span>Move to wishlist</span>
                                </>
                              }
                            />
                          </form>
                          <form action={removeFromCartAction}>
                            <CartLineHiddenFields
                              productId={line.productId}
                              size={line.size}
                              color={line.color}
                              customization={line.customization}
                            />
                            <ConfirmSubmit
                              className="cart-item-link"
                              message="Remove this item from your bag?"
                              label={
                                <>
                                  <IconTrash />
                                  <span>Remove</span>
                                </>
                              }
                            />
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <aside className="cart-summary">
                <p className="cart-summary-label">Order summary</p>
                <OrderTotals
                  subtotal={totals.subtotal}
                  shippingFee={totals.shippingFee}
                  taxAmount={totals.taxAmount}
                  taxLabel={totals.taxLabel}
                  total={totals.total}
                  currency={commerce.currency}
                />
                <p className="checkout-note">{getFreeShippingNote(commerce)}</p>
                <p className="checkout-note">Cash on delivery at checkout.</p>
                <Link href="/checkout" className="luxury-button-solid">
                  Checkout
                </Link>
                <Link href="/collections/all" className="luxury-button-outline">
                  Continue Shopping
                </Link>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
