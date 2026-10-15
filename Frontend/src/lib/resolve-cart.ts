import { PRODUCT_STATUS } from "@/constants/catalog";
import { productService } from "@/lib/api/products";
import { type CartItem, type CartState,readCart, writeCart } from "@/lib/cart-cookie";
import type { SerializedProduct } from "@/types/product";

export type ResolvedCart = {
  items: CartItem[];
  products: Map<string, SerializedProduct>;
  count: number;
};

function isPublished(product: SerializedProduct | undefined): product is SerializedProduct {
  return Boolean(product && product.status === PRODUCT_STATUS.PUBLISHED);
}

/**
 * Drop missing/unpublished lines for display.
 * Pass `{ persist: true }` from Server Actions only — cookie writes are not allowed during RSC render.
 */
export async function resolveAndPruneCart(options?: { persist?: boolean }): Promise<ResolvedCart> {
  const cart = await readCart();
  if (cart.items.length === 0) {
    return { items: [], products: new Map(), count: 0 };
  }

  const products = await productService.getByIds(cart.items.map((item) => item.productId));
  const map = new Map(products.map((product) => [product.id, product]));
  const items = cart.items.filter((item) => isPublished(map.get(item.productId)));

  if (options?.persist && items.length !== cart.items.length) {
    const next: CartState = { items };
    await writeCart(next);
  }

  return {
    items,
    products: map,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
