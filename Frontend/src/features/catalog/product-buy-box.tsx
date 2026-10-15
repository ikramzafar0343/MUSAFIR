"use client";

import { useState, useTransition } from "react";

import { IconBag, IconHeart, IconMinus, IconPlus, IconShield, IconTruck } from "@/components/icons/icons";
import { isCustomSize } from "@/constants/catalog";
import { formatMoney } from "@/constants/storefront";
import { buyNowAction } from "@/features/cart/actions";
import { AddToBagForm } from "@/features/cart/add-to-bag-form";
import { uploadCustomLogoAction } from "@/features/catalog/custom-size-actions";
import { CustomSizePanel } from "@/features/catalog/custom-size-panel";
import { ShareProduct } from "@/features/catalog/share-product";
import { SizeGuide } from "@/features/catalog/size-guide";
import { toggleWishlistAction } from "@/features/wishlist/actions";
import { notifyToast } from "@/lib/bag-events";
import type { LineCustomization } from "@/schemas/order";

export type ProductBuyModel = {
  id: string;
  title: string;
  sku: string;
  category: string;
  intro: string;
  volume: string;
  price: number;
  originalPrice?: number | null;
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  howToUse: string;
  wished: boolean;
  stock: number;
};

export function ProductBuyBox({ product, currency = "USD" }: { product: ProductBuyModel; currency?: string }) {
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [customLogoLabel, setCustomLogoLabel] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hasSale = Boolean(product.originalPrice && product.originalPrice > product.price);
  const volumeLabel = size || product.volume;
  const soldOut = product.stock < 1;
  const maxQty = Math.max(1, Math.min(20, product.stock || 1));
  const lowStock = product.stock > 0 && product.stock <= 8;
  const selectedColor = product.colors.find((item) => item.name === color);
  const customSelected = isCustomSize(size);
  const customReady = !customSelected || customName.trim().length > 0;
  const actionsDisabled = soldOut || !customReady || logoUploading;
  const customization: LineCustomization | null =
    customSelected && customName.trim()
      ? {
          name: customName.trim(),
          logoUrl: customLogoUrl,
          color: /^#[0-9A-Fa-f]{6}$/.test(customColor.trim()) ? customColor.trim() : null,
          notes: customNotes.trim() || null,
        }
      : null;

  async function handleLogoFile(file: File | null) {
    if (!file) {
      setCustomLogoUrl(null);
      setCustomLogoLabel(null);
      setLogoError(null);
      return;
    }
    setLogoUploading(true);
    setLogoError(null);
    const formData = new FormData();
    formData.set("logo", file);
    const result = await uploadCustomLogoAction(formData);
    setLogoUploading(false);
    if (result.error || !result.url) {
      setLogoError(result.error ?? "Unable to upload logo.");
      notifyToast(result.error ?? "Unable to upload logo.", "error");
      return;
    }
    setCustomLogoUrl(result.url);
    setCustomLogoLabel(file.name);
  }

  return (
    <div className="product-info">
      <div className="product-info-head">
        {product.category ? <p className="product-eyebrow">{product.category}</p> : null}
        <h1 className="product-title">{product.title}</h1>
        {product.intro ? <p className="product-lead">{product.intro}</p> : null}
        <p className="product-price-row">
          {hasSale && product.originalPrice ? (
            <span className="product-price-original">{formatMoney(product.originalPrice, currency)}</span>
          ) : null}
          <span className="product-price">{formatMoney(product.price, currency)}</span>
        </p>
        {volumeLabel ? <p className="product-volume">{volumeLabel}</p> : null}
        <p className="product-sku">{product.sku}</p>
        {soldOut ? <p className="product-stock product-stock--out">Out of stock</p> : null}
        {lowStock ? <p className="product-stock">Only {product.stock} left</p> : null}
      </div>
      {product.sizes.length > 0 ? (
        <div className="product-option">
          <span className="product-option-label">Size</span>
          <div className="product-size-list">
            {product.sizes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSize(value)}
                className={`product-size-btn ${size === value ? "product-size-btn-active" : "product-size-btn-inactive"}`}
              >
                {value}
              </button>
            ))}
          </div>
          {customSelected ? (
            <CustomSizePanel
              name={customName}
              color={customColor}
              notes={customNotes}
              logoUrl={customLogoUrl}
              logoLabel={customLogoLabel}
              uploading={logoUploading}
              error={logoError}
              onNameChange={setCustomName}
              onColorChange={setCustomColor}
              onNotesChange={setCustomNotes}
              onLogoFile={(file) => {
                void handleLogoFile(file);
              }}
              onClearLogo={() => {
                setCustomLogoUrl(null);
                setCustomLogoLabel(null);
                setLogoError(null);
              }}
            />
          ) : null}
        </div>
      ) : null}
      {product.colors.length > 0 ? (
        <div className="product-option">
          <span className="product-option-label">Shade</span>
          <div className="product-size-list">
            {product.colors.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setColor(item.name)}
                className={`product-size-btn ${color === item.name ? "product-size-btn-active" : "product-size-btn-inactive"}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <SizeGuide sizes={product.sizes} howToUse={product.howToUse} />
      <div className="product-option">
        <span className="product-option-label">Quantity</span>
        <div className="product-qty">
          <button
            type="button"
            className="product-qty-btn"
            aria-label="Decrease quantity"
            disabled={soldOut}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <IconMinus />
          </button>
          <span className="product-qty-value">{quantity}</span>
          <button
            type="button"
            className="product-qty-btn"
            aria-label="Increase quantity"
            disabled={soldOut}
            onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
          >
            <IconPlus />
          </button>
        </div>
      </div>
      {customSelected && !customReady ? (
        <p className="product-custom-error" role="status">
          Enter a name or initials to add this custom size.
        </p>
      ) : null}
      <div className="product-actions">
        <AddToBagForm
          productId={product.id}
          quantity={quantity}
          size={size}
          color={color}
          colorHex={selectedColor?.hex}
          customization={customization}
          disabled={actionsDisabled}
        >
          <button type="submit" className="product-btn-cart" disabled={actionsDisabled}>
            <IconBag />
            {soldOut ? "Out Of Stock" : "Add To Cart"}
          </button>
        </AddToBagForm>
        <form
          action={(formData) => {
            startTransition(async () => {
              const result = await buyNowAction(formData);
              if (result?.error) {
                notifyToast(result.error, "error");
              }
            });
          }}
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="quantity" value={quantity} />
          {size ? <input type="hidden" name="size" value={size} /> : null}
          {color ? <input type="hidden" name="color" value={color} /> : null}
          {selectedColor ? <input type="hidden" name="colorHex" value={selectedColor.hex} /> : null}
          {customization ? <input type="hidden" name="customization" value={JSON.stringify(customization)} /> : null}
          <button type="submit" className="product-btn-buy" disabled={actionsDisabled || pending}>
            Buy It Now
          </button>
        </form>
        <form action={toggleWishlistAction}>
          <input type="hidden" name="productId" value={product.id} />
          <button type="submit" className="product-wishlist-btn">
            <IconHeart />
            {product.wished ? "Saved to Wishlist" : "Add to Wishlist"}
          </button>
        </form>
        <ShareProduct title={product.title} />
      </div>
      <div className="product-trust-row">
        <div className="product-trust-item">
          <IconTruck />
          Delivery across Pakistan
        </div>
        <div className="product-trust-item">
          <IconShield />
          14-day exchange
        </div>
        <div className="product-trust-item">
          <IconBag />
          Cash on delivery
        </div>
      </div>
    </div>
  );
}
