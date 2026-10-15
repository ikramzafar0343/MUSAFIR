"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import { IconCheck, IconFile, IconTile } from "@/components/icons/icons";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  CATEGORY_LABELS,
  DISCOUNT_TYPES,
  normalizeCategoryFilter,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  PRODUCT_VOLUME_OPTIONS,
  type ProductCategory,
} from "@/constants/catalog";
import { currencySymbol, DEFAULT_COMMERCE_SETTINGS } from "@/constants/commerce";
import { HORSE_COAT } from "@/constants/storefront";
import { deleteProductAction, saveProductAction } from "@/features/admin/catalog-actions";
import { ColorField } from "@/features/admin/color-field";
import { createImageSlot, type ProductImageSlot,ProductImageUploader } from "@/features/admin/product-image-uploader";
import { cn } from "@/lib/cn";
import { asHexColor } from "@/lib/hex-color";
import type { SerializedProduct } from "@/types/product";

type FieldErrors = Partial<Record<"title" | "detail" | "sizes" | "price" | "stock" | "category" | "images", string>>;

function omitError(errors: FieldErrors, key: keyof FieldErrors): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}

/** Stored slugs come back as storefront slugs (e.g. `new`); map them to admin category values. */
function initialCategories(product: SerializedProduct | undefined): ProductCategory[] {
  if (!product) {
    return ["new-arrivals"];
  }
  const mapped = [product.category, ...(product.categories ?? [])]
    .map((item) => normalizeCategoryFilter(item))
    .filter((item): item is ProductCategory => Boolean(item));
  return mapped.length > 0 ? [...new Set(mapped)] : ["new-arrivals"];
}

function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="admin-product-field">
      <label className="admin-product-label" htmlFor={htmlFor}>
        {label}
      </label>
      {hint ? <p className="admin-product-kicker">{hint}</p> : null}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="admin-product-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ProductForm({
  product,
  currency = DEFAULT_COMMERCE_SETTINGS.currency,
  blush = HORSE_COAT.sorrel,
  mint: _mint = HORSE_COAT.dappleGrey,
}: {
  product?: SerializedProduct;
  currency?: string;
  blush?: string;
  mint?: string;
}) {
  const moneyAffix = currencySymbol(currency);
  const isNew = !product;
  const volumeOptions = useMemo(() => {
    const extra = (product?.sizes ?? []).filter((size) => !(PRODUCT_VOLUME_OPTIONS as readonly string[]).includes(size));
    return [...PRODUCT_VOLUME_OPTIONS, ...extra];
  }, [product]);
  const [sizes, setSizes] = useState<string[]>(product?.sizes?.length ? [...product.sizes] : []);
  const [bestSeller, setBestSeller] = useState(product?.bestSeller ?? false);
  const [categories, setCategories] = useState<ProductCategory[]>(() => initialCategories(product));
  const [discountType, setDiscountType] = useState(product?.discountType || DISCOUNT_TYPES.PERCENTAGE);
  const [slots, setSlots] = useState<ProductImageSlot[]>(() =>
    (product?.images ?? []).filter((image) => image.url).map((image) => createImageSlot(image)),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [intent, setIntent] = useState<"draft" | "publish" | null>(null);
  const [saveError, setSaveError] = useState("");
  const [pending, startTransition] = useTransition();

  function validate(nextIntent: "draft" | "publish"): FieldErrors {
    const next: FieldErrors = {};
    const title = String((document.getElementById("title") as HTMLInputElement | null)?.value ?? "").trim();
    if (title.length < 2) {
      next.title = "Product name is required.";
    }
    if (nextIntent === "draft") {
      return next;
    }
    const detail = String((document.getElementById("detail") as HTMLTextAreaElement | null)?.value ?? "").trim();
    if (!detail) {
      next.detail = "Description is required.";
    }
    if (sizes.length === 0) {
      next.sizes = "Pick at least one size.";
    }
    const price = String((document.getElementById("price") as HTMLInputElement | null)?.value ?? "").trim();
    if (price === "" || Number(price) < 0) {
      next.price = "Base price is required.";
    }
    const stock = String((document.getElementById("stock") as HTMLInputElement | null)?.value ?? "").trim();
    if (stock === "" || Number(stock) < 0) {
      next.stock = "Stock is required.";
    }
    if (categories.length === 0) {
      next.category = "Pick at least one category.";
    }
    if (slots.length === 0) {
      next.images = "Add a main product photo.";
    }
    return next;
  }

  function submit(nextIntent: "draft" | "publish") {
    const nextErrors = validate(nextIntent);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const form = document.getElementById("admin-product-form") as HTMLFormElement | null;
    if (!form) {
      return;
    }
    const formData = new FormData(form);
    formData.set("status", nextIntent === "draft" ? PRODUCT_STATUS.DRAFT : PRODUCT_STATUS.PUBLISHED);
    formData.set("sizes", sizes.join("\n"));
    formData.set("includes", sizes[0] ?? "");
    formData.delete("categories");
    categories.forEach((category) => formData.append("categories", category));
    formData.set(
      "tileColor",
      asHexColor((form.querySelector('input[name="tileColor"]') as HTMLInputElement | null)?.value, blush),
    );
    if (bestSeller) {
      formData.set("bestSeller", "on");
    } else {
      formData.delete("bestSeller");
    }
    slots.forEach((slot, index) => {
      if (slot.file) {
        formData.set(`imageFile${index + 1}`, slot.file);
      }
      if (slot.url) {
        formData.set(`imageUrl${index + 1}`, slot.url);
      }
    });
    setIntent(nextIntent);
    setSaveError("");
    startTransition(() => {
      void saveProductAction(formData)
        .then((result) => {
          if (result?.error) {
            setSaveError(result.error);
          }
        })
        .catch((error: unknown) => {
          if (typeof error === "object" && error && "digest" in error) {
            return;
          }
          setSaveError(error instanceof Error ? error.message : "Product could not be saved");
        });
    });
  }

  function toggleCategory(category: ProductCategory) {
    const next = categories.includes(category)
      ? categories.filter((item) => item !== category)
      : [...categories, category];
    setCategories(next);
    if (next.length > 0) {
      setErrors((current) => omitError(current, "category"));
    }
  }

  function toggleSize(size: string) {
    setSizes((current) => {
      const next = current.includes(size) ? current.filter((item) => item !== size) : [...current, size];
      if (next.length > 0) {
        setErrors((errorsState) => omitError(errorsState, "sizes"));
      }
      return next;
    });
  }

  return (
    <div className="admin-product-page">
      <form id="admin-product-form" className="admin-product-form" autoComplete="off" onSubmit={(event) => event.preventDefault()}>
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        <input type="hidden" name="discountType" value={discountType} />

        <header className="admin-product-toolbar">
          <div className="admin-product-toolbar-copy">
            <h1 className="admin-product-title">
              <IconTile />
              {isNew ? "Add New Product" : "Edit Product"}
            </h1>
            {product ? <p className="admin-product-sku">{product.sku}</p> : null}
          </div>
          <div className="admin-product-toolbar-actions">
            {saveError ? (
              <p className="admin-product-error" role="alert">
                {saveError}
              </p>
            ) : null}
            <button type="button" className="admin-product-ghost" disabled={pending} onClick={() => submit("draft")}>
              <IconFile />
              {pending && intent === "draft" ? "Saving..." : "Save Draft"}
            </button>
            <button type="button" className="admin-product-cta" disabled={pending} onClick={() => submit("publish")}>
              <IconCheck />
              {pending && intent === "publish" ? (isNew ? "Creating..." : "Saving...") : isNew ? "Add Product" : "Save Product"}
            </button>
          </div>
        </header>

        <div className="admin-product-grid">
          <section className="admin-product-card admin-product-card--general" aria-labelledby="general-heading">
            <h2 id="general-heading" className="admin-product-card-title">
              General Information
            </h2>
            <Field
              label="Name Product"
              htmlFor="title"
              error={errors.title}
            >
              <input
                id="title"
                className="admin-product-soft"
                name="title"
                defaultValue={product?.title ?? ""}
                placeholder="Navy Windowpane Blazer"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  setErrors((current) => {
                    if (value.length >= 2) {
                      return omitError(current, "title");
                    }
                    return { ...current, title: "Product name is required." };
                  });
                }}
              />
            </Field>
            <Field label="Description Product" htmlFor="detail" error={errors.detail}>
              <textarea
                id="detail"
                className="admin-product-soft admin-product-soft-area"
                name="detail"
                rows={5}
                defaultValue={product?.description.detail || product?.description.intro || ""}
                placeholder="Tailored navy windowpane blazer with a clean, modern cut."
                aria-invalid={Boolean(errors.detail)}
                aria-describedby={errors.detail ? "detail-error" : undefined}
                onBlur={(event) => {
                  if (event.target.value.trim()) {
                    setErrors((current) => omitError(current, "detail"));
                  }
                }}
              />
            </Field>
            <div className="admin-product-pair">
              <fieldset className={cn("admin-product-field", errors.sizes && "has-error")}>
                <legend className="admin-product-label">Size</legend>
                <p className="admin-product-kicker">Pick available size</p>
                <div className="admin-product-sizes">
                  {volumeOptions.map((size) => {
                    const selected = sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        className={cn("admin-product-size", selected && "is-selected")}
                        aria-pressed={selected}
                        aria-label={size}
                        onClick={() => toggleSize(size)}
                      >
                        {size.replace(" ml", "ml")}
                      </button>
                    );
                  })}
                </div>
                {errors.sizes ? (
                  <p className="admin-product-error" role="alert">
                    {errors.sizes}
                  </p>
                ) : null}
              </fieldset>
              <fieldset className="admin-product-field">
                <legend className="admin-product-label">Placement</legend>
                <p className="admin-product-kicker">Show in best-seller slots</p>
                <div className="admin-product-radios">
                  <label className={cn("admin-product-radio", !bestSeller && "is-selected")}>
                    <input type="radio" checked={!bestSeller} onChange={() => setBestSeller(false)} />
                    Standard
                  </label>
                  <label className={cn("admin-product-radio", bestSeller && "is-selected")}>
                    <input type="radio" checked={bestSeller} onChange={() => setBestSeller(true)} />
                    Best seller
                  </label>
                </div>
              </fieldset>
            </div>
          </section>

          <section className="admin-product-card admin-product-card--image" aria-labelledby="image-heading">
            <h2 id="image-heading" className="admin-product-card-title">
              Upload Img
            </h2>
            <ProductImageUploader
              slots={slots}
              onChange={(next) => {
                setSlots(next);
                if (next.length > 0) {
                  setErrors((current) => omitError(current, "images"));
                }
              }}
              error={errors.images}
            />
            <ColorField
              name="tileColor"
              label="Card backdrop"
              defaultValue={product?.tileColor || HORSE_COAT.sorrel}
              presets={[
                { label: "Warm", color: HORSE_COAT.sorrel },
                { label: "Cool", color: HORSE_COAT.dappleGrey },
                { label: "Neutral", color: HORSE_COAT.blueRoan },
              ]}
            />
          </section>

          <section className="admin-product-card admin-product-card--pricing" aria-labelledby="pricing-heading">
            <h2 id="pricing-heading" className="admin-product-card-title">
              Pricing And Stock
            </h2>
            <div className="admin-product-fields">
              <Field label="Base Pricing" htmlFor="price" error={errors.price}>
                <span className="admin-product-affix">
                  <span className="admin-product-affix-label">{moneyAffix}</span>
                  <input
                    id="price"
                    className="admin-product-soft"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    defaultValue={product?.price ?? ""}
                    placeholder="6200"
                    aria-invalid={Boolean(errors.price)}
                    aria-describedby={errors.price ? "price-error" : undefined}
                  />
                </span>
              </Field>
              <Field label="Stock" htmlFor="stock" error={errors.stock}>
                <input
                  id="stock"
                  className="admin-product-soft"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  defaultValue={product?.stock ?? ""}
                  placeholder="77"
                  aria-invalid={Boolean(errors.stock)}
                  aria-describedby={errors.stock ? "stock-error" : undefined}
                />
              </Field>
              <Field label="Discount" htmlFor="discount">
                <span className="admin-product-affix">
                  <input
                    id="discount"
                    className="admin-product-soft"
                    name="discount"
                    type="number"
                    min="0"
                    max={discountType === DISCOUNT_TYPES.PERCENTAGE ? 100 : undefined}
                    step="1"
                    inputMode="numeric"
                    defaultValue={product?.discount || ""}
                    placeholder="0"
                  />
                  <span className="admin-product-affix-label">{discountType === DISCOUNT_TYPES.PERCENTAGE ? "%" : moneyAffix}</span>
                </span>
              </Field>
              <Field label="Discount Type" htmlFor="discountTypeSelect">
                <select
                  id="discountTypeSelect"
                  className="admin-product-soft admin-product-select"
                  value={discountType}
                  onChange={(event) => setDiscountType(event.target.value)}
                >
                  <option value={DISCOUNT_TYPES.PERCENTAGE}>Percentage</option>
                  <option value={DISCOUNT_TYPES.FIXED}>Fixed amount</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="admin-product-card admin-product-card--category" aria-labelledby="category-heading">
            <h2 id="category-heading" className="admin-product-card-title">
              Category
            </h2>
            <fieldset
              className={cn("admin-product-field", errors.category && "has-error")}
              aria-describedby={errors.category ? "category-error" : undefined}
            >
              <legend className="admin-product-label">Product Categories</legend>
              <p className="admin-product-kicker">
                Tick every collection this product belongs in. The first one ticked is its main category.
              </p>
              <div className="admin-product-categories">
                {PRODUCT_CATEGORIES.map((category) => {
                  const checked = categories.includes(category);
                  return (
                    <label key={category} className={cn("admin-product-radio", checked && "is-selected")}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCategory(category)} />
                      {CATEGORY_LABELS[category] ?? category}
                      {categories[0] === category ? <span className="admin-product-category-main">Main</span> : null}
                    </label>
                  );
                })}
              </div>
              {errors.category ? (
                <p id="category-error" className="admin-product-error" role="alert">
                  {errors.category}
                </p>
              ) : null}
            </fieldset>
          </section>
        </div>
      </form>

      {product ? (
        <section className="admin-product-danger" aria-labelledby="product-remove-heading">
          <h2 id="product-remove-heading" className="admin-product-card-title">
            Remove listing
          </h2>
          <p className="admin-product-kicker">Archives this product so it no longer appears in the shop.</p>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmit className="admin-product-delete" message="Archive this product from the shop?" label="Delete product" />
          </form>
        </section>
      ) : null}
    </div>
  );
}
