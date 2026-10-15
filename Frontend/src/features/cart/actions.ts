"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isCustomSize, PRODUCT_STATUS } from "@/constants/catalog";
import { calculateOrderTotals, getFreeShippingNote } from "@/constants/commerce";
import { orderService } from "@/lib/api/orders";
import { productService } from "@/lib/api/products";
import { readCart, writeCart } from "@/lib/cart-cookie";
import { readCustomizationInput, sameCartLine } from "@/lib/cart-line";
import { parseSchema } from "@/lib/parse-schema";
import { resolveAndPruneCart } from "@/lib/resolve-cart";
import { readWishlist, writeWishlist } from "@/lib/wishlist-cookie";
import { uuidSchema } from "@/schemas/common";
import { cartItemSchema, type LineCustomization } from "@/schemas/order";

export type CartActionResult = { ok?: boolean; error?: string };

export type MiniCartLine = {
  productId: string;
  title: string;
  image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  customization: LineCustomization | null;
  lineTotal: number;
};

export type MiniCartSnapshot = {
  lines: MiniCartLine[];
  count: number;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  taxLabel: string;
  total: number;
  freeShippingNote: string;
  currency: string;
};

async function applyCartItem(formData: FormData): Promise<CartActionResult> {
  const item = parseSchema(cartItemSchema, {
    productId: String(formData.get("productId") ?? ""),
    quantity: Number(formData.get("quantity") ?? 1),
    size: formData.get("size") ? String(formData.get("size")) : null,
    color: formData.get("color") ? String(formData.get("color")) : null,
    colorHex: formData.get("colorHex") ? String(formData.get("colorHex")) : null,
    customization: readCustomizationInput(formData),
  });
  if (isCustomSize(item.size) && !item.customization?.name) {
    return { error: "Enter a name or initials for a custom size." };
  }
  const products = await productService.getByIds([item.productId]);
  const product = products[0];
  if (!product || product.status !== PRODUCT_STATUS.PUBLISHED) {
    return { error: "This product is no longer available." };
  }
  const cart = await readCart();
  const existing = cart.items.find((entry) =>
    sameCartLine(entry, {
      productId: item.productId,
      size: item.size ?? null,
      color: item.color ?? null,
      customization: item.customization ?? null,
    }),
  );
  const nextQuantity = (existing?.quantity ?? 0) + item.quantity;
  if (product.stock < 1) {
    return { error: "This product is out of stock." };
  }
  if (nextQuantity > product.stock) {
    return { error: `Only ${product.stock} left.` };
  }
  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({ ...item, quantity: nextQuantity });
  }
  await writeCart(cart);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addToCartAction(formData: FormData): Promise<CartActionResult> {
  try {
    return await applyCartItem(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to add to bag" };
  }
}

function lineKey(formData: FormData) {
  return {
    productId: String(formData.get("productId") ?? ""),
    size: formData.get("size") ? String(formData.get("size")) : null,
    color: formData.get("color") ? String(formData.get("color")) : null,
    customization: readCustomizationInput(formData),
  };
}

function sameLine(
  item: {
    productId: string;
    size?: string | null | undefined;
    color?: string | null | undefined;
    customization?: LineCustomization | null | undefined;
  },
  key: ReturnType<typeof lineKey>,
): boolean {
  return sameCartLine(item, key);
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const key = lineKey(formData);
  const cart = await readCart();
  await writeCart({
    items: cart.items.filter((item) => !sameLine(item, key)),
  });
  revalidatePath("/", "layout");
}

export async function updateCartQuantityAction(formData: FormData): Promise<void> {
  const quantity = Number(formData.get("quantity") ?? 0);
  if (quantity < 1) {
    await removeFromCartAction(formData);
    return;
  }
  const key = lineKey(formData);
  const cart = await readCart();
  const existing = cart.items.find((item) => sameLine(item, key));
  if (!existing) {
    return;
  }
  const products = await productService.getByIds([existing.productId]);
  const product = products[0];
  if (!product || product.status !== PRODUCT_STATUS.PUBLISHED || product.stock < 1) {
    await writeCart({
      items: cart.items.filter((item) => !sameLine(item, key)),
    });
    revalidatePath("/", "layout");
    return;
  }
  existing.quantity = Math.min(20, quantity, Math.max(1, product.stock));
  await writeCart(cart);
  revalidatePath("/", "layout");
}

export async function moveCartItemToWishlistAction(formData: FormData): Promise<void> {
  const productId = parseSchema(uuidSchema, String(formData.get("productId") ?? ""));
  const key = lineKey(formData);
  const [cart, wishlist] = await Promise.all([readCart(), readWishlist()]);
  await writeCart({
    items: cart.items.filter((item) => !sameLine(item, key)),
  });
  if (!wishlist.ids.includes(productId)) {
    await writeWishlist({ ids: [...wishlist.ids, productId] });
  }
  revalidatePath("/", "layout");
}

export async function buyNowAction(formData: FormData): Promise<CartActionResult> {
  const result = await addToCartAction(formData);
  if (result.error) {
    return result;
  }
  redirect("/checkout");
}

export async function getMiniCartAction(): Promise<MiniCartSnapshot> {
  const [{ items, products }, commerce] = await Promise.all([
    resolveAndPruneCart({ persist: true }),
    orderService.getCommerceSettings(),
  ]);
  const lines = items
    .map((item) => {
      const product = products.get(item.productId);
      if (!product || product.status !== PRODUCT_STATUS.PUBLISHED) {
        return null;
      }
      const price = Number(product.effectivePrice ?? product.price ?? 0);
      return {
        productId: item.productId,
        title: String(product.title),
        image: product.images[0]?.url ?? null,
        quantity: item.quantity,
        size: item.size ?? null,
        color: item.color ?? null,
        customization: item.customization ?? null,
        lineTotal: price * item.quantity,
      };
    })
    .filter((line): line is MiniCartLine => line !== null);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totals = calculateOrderTotals(subtotal, commerce);
  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    ...totals,
    freeShippingNote: getFreeShippingNote(commerce),
    currency: commerce.currency,
  };
}
