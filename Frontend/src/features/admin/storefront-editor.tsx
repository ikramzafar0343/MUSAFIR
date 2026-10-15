"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  currencyOptionLabel,
  formatMoney as formatCommerceMoney,
  normalizeCurrency,
  resolveCommerceSettings,
  STORE_CURRENCIES,
} from "@/constants/commerce";
import {
  formatMoney,
  HORSE_COAT,
  MEGA_MENU_IDS,
  PRODUCT_CARD_COATS,
  resolveStorefrontContent,
  resolveStorefrontTheme,
  SHOP_CATEGORY_ICONS,
  type StorefrontMatchingLook,
  type StorefrontNavLink,
  type StorefrontShopCategory,
} from "@/constants/storefront";
import { IconStorefront } from "@/features/admin/admin-nav-icons";
import { ColorField } from "@/features/admin/color-field";
import { HeroVideoField } from "@/features/admin/hero-video-field";
import { ImageUrlField } from "@/features/admin/image-url-field";
import { MediaUrlField } from "@/features/admin/media-url-field";
import { publishStorefrontAction } from "@/features/admin/storefront-actions";
import { UnsavedGuard } from "@/features/admin/unsaved-guard";
import { AdminUploadBusyProvider, useAdminUploadBusy } from "@/features/admin/upload-busy";
import type { StorefrontState } from "@/lib/api/storefront";

const COLLECTION_LABELS: Record<string, string> = {
  all: "Shop all",
  new: "New arrivals",
  "coats-blazers": "Coats & Blazers",
  shirts: "Formal Shirts",
  trousers: "Trousers",
  shoes: "Footwear",
  "matching-pairs": "Matching Sets",
};

const MEGA_MENU_LABELS: Record<(typeof MEGA_MENU_IDS)[number], string> = {
  navShop: "Shop mega-menu",
  navCustom: "Legacy mega-menu (unused)",
  navDisciplines: "Legacy mega-menu (unused)",
};

const FEATURE_ICONS = ["stitch", "leather", "shield", "truck"] as const;

const TABS = [
  { id: "colors", label: "Colors" },
  { id: "homepage", label: "Homepage" },
  { id: "shop", label: "Shop" },
  { id: "nav", label: "Nav" },
  { id: "bestsellers", label: "Best sellers" },
  { id: "copy", label: "Copy" },
  { id: "checkout", label: "Checkout" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SoftInput({
  label,
  hint,
  name,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div className="admin-product-field">
      <label className="admin-product-label" htmlFor={name}>
        {label}
      </label>
      {hint ? <p className="admin-product-kicker">{hint}</p> : null}
      <input id={name} name={name} className="admin-product-soft" {...props} />
    </div>
  );
}

function SoftArea({
  label,
  name,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div className="admin-product-field admin-product-field--full">
      <label className="admin-product-label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} className="admin-product-soft admin-product-soft-area" {...props} />
    </div>
  );
}

function CurrencyField({ defaultValue }: { defaultValue: string }) {
  const [currency, setCurrency] = useState(normalizeCurrency(defaultValue));
  return (
    <div className="admin-product-field admin-product-field--full">
      <label className="admin-product-label" htmlFor="currency">
        Store currency
      </label>
      <p className="admin-product-kicker">
        Prices stay as numbers — switching currency does not convert them. Re-check product prices, shipping, and
        promos after you change this.
      </p>
      <select
        id="currency"
        name="currency"
        className="admin-product-soft"
        value={currency}
        onChange={(event) => setCurrency(normalizeCurrency(event.target.value))}
      >
        {STORE_CURRENCIES.map((item) => (
          <option key={item.code} value={item.code}>
            {currencyOptionLabel(item.code)}
          </option>
        ))}
      </select>
      <p className="admin-product-kicker" style={{ marginTop: "0.5rem" }}>
        Preview: {formatCommerceMoney(1234.5, currency)}
      </p>
    </div>
  );
}

function PublishButton() {
  const { pending } = useFormStatus();
  const { isBusy } = useAdminUploadBusy();
  const blocked = pending || isBusy;
  return (
    <button
      type="submit"
      className="admin-product-cta"
      disabled={blocked}
      aria-busy={isBusy || undefined}
      title={isBusy ? "Wait for uploads to finish" : undefined}
    >
      {pending ? "Publishing..." : "Publish"}
    </button>
  );
}

function SkuSelect({
  label,
  name,
  value,
  catalog,
}: {
  label: string;
  name: string;
  value: string;
  catalog: { sku: string; title: string }[];
}) {
  const options = catalog.some((item) => item.sku === value) || !value ? catalog : [{ sku: value, title: value }, ...catalog];
  return (
    <div className="admin-product-field">
      <label className="admin-product-label" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} className="admin-product-soft admin-product-select" defaultValue={value}>
        <option value="">Select a published product</option>
        {options.map((item) => (
          <option key={`${name}-${item.sku}`} value={item.sku}>
            {item.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export function StorefrontEditor({
  storefront,
  catalog,
}: {
  storefront: StorefrontState;
  catalog: { sku: string; title: string }[];
}) {
  const commerce = resolveCommerceSettings(storefront.commerce);
  const theme = resolveStorefrontTheme(storefront.theme);
  const content = resolveStorefrontContent(storefront.content);
  const [tab, setTab] = useState<TabId>("colors");
  const [navLinks, setNavLinks] = useState<StorefrontNavLink[]>(() => content.navLinks.map((item) => ({ ...item })));
  const [matchingLooks, setMatchingLooks] = useState<StorefrontMatchingLook[]>(() =>
    content.matchingLooks.map((item) => ({ ...item, productIds: [...item.productIds] })),
  );
  const [shopCategories, setShopCategories] = useState<StorefrontShopCategory[]>(() =>
    content.shopCategories.map((item) => ({ ...item })),
  );
  const [publishState, publishAction] = useActionState(publishStorefrontAction, {});
  const homepageImages = [
    content.heroProductSrc,
    content.brandStoryPrimarySrc,
    content.brandStorySecondarySrc,
    content.brandStoryPortraitSrc,
    content.productHighlightsImage,
    content.glowStatsImage,
  ];
  const filledHomepage = homepageImages.filter(Boolean).length;
  const tilePresets = [
    { label: "Warm", color: HORSE_COAT.sorrel },
    { label: "Cool", color: HORSE_COAT.dappleGrey },
    { label: "Neutral", color: HORSE_COAT.blueRoan },
  ];

  function addNavLink() {
    setNavLinks((current) => {
      if (current.length >= 12) {
        return current;
      }
      return [
        ...current,
        {
          id: `nav-${crypto.randomUUID().slice(0, 8)}`,
          label: "New link",
          path: "/collections/all",
          hidden: false,
        },
      ];
    });
  }

  function addMatchingLook() {
    setMatchingLooks((current) => {
      if (current.length >= 40) {
        return current;
      }
      const n = current.length + 1;
      return [
        ...current,
        {
          id: `look-${crypto.randomUUID().slice(0, 8)}`,
          title: "",
          slug: `look-${n}`,
          description: "",
          coverSrc: "",
          productIds: [],
          published: false,
          sortOrder: current.length,
        },
      ];
    });
  }

  return (
    <AdminUploadBusyProvider>
    <UnsavedGuard>
      <form action={publishAction} noValidate className="admin-product-page admin-product-form">
        <header className="admin-product-toolbar">
          <div className="admin-product-toolbar-copy">
            <h1 className="admin-product-title">
              <IconStorefront />
              Storefront
            </h1>
            <p className="admin-product-sku">
              Edit categories, nav, photos, and copy — then click <strong>Publish</strong> at the top to update the live
              site
            </p>
          </div>
          <div className="admin-product-toolbar-actions">
            {publishState.error ? (
              <p className="admin-product-error" role="alert">
                {publishState.error}
              </p>
            ) : null}
            <PublishButton />
          </div>
        </header>
        <input type="hidden" name="heroProductAlt" value={content.heroProductAlt} />
        <input type="hidden" name="faqImageAlt" value={content.faqImageAlt} />
        <input type="hidden" name="categoryCount" value={shopCategories.length} />
        <input type="hidden" name="navCount" value={navLinks.length} />

        <section className="admin-orders-stats" aria-label="Storefront summary">
          <article className="admin-orders-stat">
            <p className="admin-orders-stat-label">Homepage images</p>
            <p className="admin-orders-stat-value">
              {filledHomepage}
              <span className="admin-storefront-stat-suffix">/6</span>
            </p>
          </article>
          <article className="admin-orders-stat">
            <p className="admin-orders-stat-label">Categories</p>
            <p className="admin-orders-stat-value">
              {shopCategories.filter((item) => !item.hidden).length}
              <span className="admin-storefront-stat-suffix">/{shopCategories.length}</span>
            </p>
          </article>
          <article className="admin-orders-stat">
            <p className="admin-orders-stat-label">Nav links</p>
            <p className="admin-orders-stat-value">
              {navLinks.filter((item) => !item.hidden).length}
              <span className="admin-storefront-stat-suffix">/{navLinks.length}</span>
            </p>
          </article>
          <article className="admin-orders-stat">
            <p className="admin-orders-stat-label">Free shipping</p>
            <p className="admin-orders-stat-value admin-storefront-stat-text">
              {commerce.freeShippingEnabled
                ? formatMoney(commerce.freeShippingThreshold, commerce.currency)
                : "Off"}
            </p>
          </article>
        </section>

        <nav className="admin-orders-filters" aria-label="Storefront sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-orders-filter${tab === item.id ? " is-active" : ""}`}
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-storefront-stack" hidden={tab !== "colors"}>
        <section className="admin-product-card" aria-labelledby="storefront-colors-heading">
          <h2 id="storefront-colors-heading" className="admin-product-card-title">
            Color scheme
          </h2>
          <p className="admin-product-kicker admin-storefront-lead">
            These colors paint the live shop: background, type, buttons, mint and blush washes.
          </p>
          <div className="admin-storefront-colors">
            <ColorField name="themeBg" label="Background" defaultValue={theme.bg} />
            <ColorField name="themePrimary" label="Primary" defaultValue={theme.primary} />
            <ColorField name="themeSecondary" label="Secondary" defaultValue={theme.secondary} />
            <ColorField name="themeAccent" label="Accent" defaultValue={theme.accent} />
            <ColorField name="themeMint" label="Mint" defaultValue={theme.mint} />
            <ColorField name="themeBlush" label="Blush" defaultValue={theme.blush} />
          </div>
        </section>
        <section className="admin-product-card" aria-labelledby="storefront-tiles-heading">
          <h2 id="storefront-tiles-heading" className="admin-product-card-title">
            Collection card backdrops
          </h2>
          <p className="admin-product-kicker admin-storefront-lead">
            These three colors rotate behind products on collection, wishlist, and related-product grids.
          </p>
          <div className="admin-storefront-colors">
            <ColorField
              name="productCardColor1"
              label="Card 1"
              defaultValue={content.productCardColors[0] ?? PRODUCT_CARD_COATS[0]!}
              presets={tilePresets}
            />
            <ColorField
              name="productCardColor2"
              label="Card 2"
              defaultValue={content.productCardColors[1] ?? PRODUCT_CARD_COATS[1]!}
              presets={tilePresets}
            />
            <ColorField
              name="productCardColor3"
              label="Card 3"
              defaultValue={content.productCardColors[2] ?? PRODUCT_CARD_COATS[2]!}
              presets={tilePresets}
            />
          </div>
        </section>
        </div>

        <div className="admin-storefront-stack" hidden={tab !== "homepage"}>
          <section className="admin-product-card" aria-labelledby="storefront-hero-heading">
            <h2 id="storefront-hero-heading" className="admin-product-card-title">
              Homepage hero
            </h2>
            <div className="admin-product-fields">
              <HeroVideoField
                label="Hero video"
                defaultSrc={content.heroVideoSrc}
                defaultMobileSrc={content.heroVideoMobileSrc}
                defaultPosterSrc={content.heroVideoPosterSrc}
                hint="≥2s clip on a plain backdrop (white/cream works best). Background is removed automatically — the full clip is cut to transparent alpha."
              />
              <ImageUrlField name="heroProductSrc" label="Hero product" defaultValue={content.heroProductSrc} />
              <div className="admin-storefront-nested">
                <SoftInput label="Hero headline" name="heroHeadline" defaultValue={content.heroHeadline} />
                <SoftArea label="Hero support" name="heroSupport" rows={3} defaultValue={content.heroSupport} />
                <ColorField
                  name="heroStageColor"
                  label="Product backdrop"
                  defaultValue={content.heroStageColor}
                  presets={tilePresets}
                />
              </div>
            </div>
          </section>
          <section className="admin-product-card" aria-labelledby="storefront-home-images-heading">
            <h2 id="storefront-home-images-heading" className="admin-product-card-title">
              Homepage images
            </h2>
            <p className="admin-product-kicker admin-storefront-lead">
              Upload studio PNGs or JPGs — backgrounds are auto-matted to transparent with fringe cleanup.
              Re-upload older files once if they still show a white edge.
            </p>
            <div className="admin-product-fields">
              <ImageUrlField
                name="brandStoryPrimarySrc"
                label="Brand story primary"
                defaultValue={content.brandStoryPrimarySrc}
              />
              <ImageUrlField
                name="brandStorySecondarySrc"
                label="Brand story secondary"
                defaultValue={content.brandStorySecondarySrc}
              />
              <ImageUrlField
                name="brandStoryPortraitSrc"
                label="Brand story portrait"
                defaultValue={content.brandStoryPortraitSrc}
              />
              <ImageUrlField
                name="productHighlightsImage"
                label="Product highlights"
                defaultValue={content.productHighlightsImage}
                hint="Center hero image for the Why MUSAFIR board. Side floating cutouts are disabled."
              />
              <ImageUrlField
                name="glowStatsImage"
                label="Closing CTA banner"
                defaultValue={content.glowStatsImage}
                hint="Closing CTA band image. Auto-matted to transparent on upload; re-upload once to refresh old fringe."
              />
              <ImageUrlField
                name="faqImage"
                label="FAQ photo"
                defaultValue={content.faqImage}
                hint="Shown beside the FAQ list on the homepage. Remove clears it on the live shop after Publish."
              />
            </div>
          </section>

          <section className="admin-product-card" aria-labelledby="storefront-custom-tack-heading">
            <h2 id="storefront-custom-tack-heading" className="admin-product-card-title">
              Made for your look
            </h2>
            <p className="admin-product-kicker admin-storefront-lead">
              Curved maroon customization board — headline, numbered options, product image, and CTA.
            </p>
            <div className="admin-product-fields">
              <SoftInput label="Title" name="customTackTitle" defaultValue={content.customTack.title} />
              <SoftInput
                label="Title accent"
                name="customTackTitleAccent"
                defaultValue={content.customTack.titleAccent}
              />
              <SoftArea label="Lead" name="customTackLead" rows={3} defaultValue={content.customTack.lead} />
              <ImageUrlField
                name="customTackImage"
                label="Product image"
                defaultValue={content.customTack.image}
                hint="Studio product photo — auto transparent matte with fringe cleanup on upload."
              />
              <SoftInput label="CTA label" name="customTackCtaLabel" defaultValue={content.customTack.ctaLabel} />
              <SoftInput label="CTA path" name="customTackCtaHref" defaultValue={content.customTack.ctaHref} />
            </div>
            <div className="admin-storefront-groups">
              {content.customTack.options.map((option, index) => (
                <div key={option.id} className="admin-storefront-group">
                  <input type="hidden" name={`customTackOptionId_${index}`} value={option.id} />
                  <p className="admin-product-label">Option {index + 1}</p>
                  <div className="admin-product-fields">
                    <SoftInput
                      label="Title"
                      name={`customTackOptionTitle_${index}`}
                      defaultValue={option.title}
                    />
                    <SoftArea
                      label="Description"
                      name={`customTackOptionDescription_${index}`}
                      rows={2}
                      defaultValue={option.description}
                    />
                    <SoftInput label="Path" name={`customTackOptionHref_${index}`} defaultValue={option.href} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-product-card" aria-labelledby="storefront-disciplines-heading">
            <h2 id="storefront-disciplines-heading" className="admin-product-card-title">
              Legacy section (disabled)
            </h2>
            <p className="admin-product-kicker admin-storefront-lead">
              Former disciplines section — permanently disabled for the menswear storefront. Fields are ignored on
              publish.
            </p>
            <div className="admin-product-fields">
              <SoftInput label="Title" name="disciplinesTitle" defaultValue={content.disciplinesSection.title} />
              <SoftInput
                label="Title mark"
                name="disciplinesTitleMark"
                defaultValue={content.disciplinesSection.titleMark}
              />
              <SoftArea
                label="Support"
                name="disciplinesSupport"
                rows={2}
                defaultValue={content.disciplinesSection.support}
              />
              <SoftInput
                label="CTA label"
                name="disciplinesCtaLabel"
                defaultValue={content.disciplinesSection.ctaLabel}
              />
              <SoftInput
                label="CTA path"
                name="disciplinesCtaHref"
                defaultValue={content.disciplinesSection.ctaHref}
              />
            </div>
            <div className="admin-storefront-groups">
              {content.disciplinesSection.items.map((item, index) => (
                <div key={item.id} className="admin-storefront-group">
                  <input type="hidden" name={`disciplineItemId_${index}`} value={item.id} />
                  <p className="admin-product-label">Discipline {index + 1}</p>
                  <div className="admin-product-fields">
                    <SoftInput label="Title" name={`disciplineItemTitle_${index}`} defaultValue={item.title} />
                    <SoftArea
                      label="Description"
                      name={`disciplineItemDescription_${index}`}
                      rows={2}
                      defaultValue={item.description}
                    />
                    <SoftInput label="Path" name={`disciplineItemHref_${index}`} defaultValue={item.href} />
                    <SoftInput label="Card CTA" name={`disciplineItemCta_${index}`} defaultValue={item.cta} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-product-card" aria-labelledby="storefront-rider-gallery-heading">
            <h2 id="storefront-rider-gallery-heading" className="admin-product-card-title">
              Lookbook gallery
            </h2>
            <p className="admin-product-kicker admin-storefront-lead">
              Gallery tiles — photo or video per slot, plus label, path, and tone.
            </p>
            <div className="admin-product-fields">
              <SoftInput label="Title" name="riderGalleryTitle" defaultValue={content.riderGallery.title} />
              <SoftInput
                label="Title mark"
                name="riderGalleryTitleMark"
                defaultValue={content.riderGallery.titleMark}
              />
              <SoftArea label="Lead" name="riderGalleryLead" rows={2} defaultValue={content.riderGallery.lead} />
              <SoftInput
                label="CTA label"
                name="riderGalleryCtaLabel"
                defaultValue={content.riderGallery.ctaLabel}
              />
              <SoftInput label="CTA path" name="riderGalleryCtaHref" defaultValue={content.riderGallery.ctaHref} />
            </div>
            <div className="admin-storefront-groups">
              {content.riderGallery.items.map((item, index) => (
                <div key={item.id} className="admin-storefront-group">
                  <input type="hidden" name={`riderGalleryItemId_${index}`} value={item.id} />
                  <p className="admin-product-label">Tile {index + 1}</p>
                  <div className="admin-product-fields">
                    <MediaUrlField
                      name={`riderGalleryItemSrc_${index}`}
                      label="Media"
                      defaultValue={item.src}
                      defaultPoster={item.poster ?? ""}
                      hint="Photo or video. Videos get an automatic cover frame."
                    />
                    <SoftInput label="Label" name={`riderGalleryItemLabel_${index}`} defaultValue={item.label} />
                    <SoftInput label="Alt text" name={`riderGalleryItemAlt_${index}`} defaultValue={item.alt} />
                    <SoftInput label="Path" name={`riderGalleryItemHref_${index}`} defaultValue={item.href} />
                    <div className="admin-product-field">
                      <label className="admin-product-label" htmlFor={`riderGalleryItemTone_${index}`}>
                        Tone
                      </label>
                      <select
                        id={`riderGalleryItemTone_${index}`}
                        name={`riderGalleryItemTone_${index}`}
                        className="admin-product-soft"
                        defaultValue={item.tone}
                      >
                        <option value="warm">Warm</option>
                        <option value="mint">Mint</option>
                        <option value="photo">Photo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-storefront-stack" hidden={tab !== "shop"}>
          <section className="admin-product-card" aria-labelledby="storefront-shop-heading">
            <div className="admin-storefront-head">
              <div>
                <h2 id="storefront-shop-heading" className="admin-product-card-title">
                  Shop by category
                </h2>
                <p className="admin-product-kicker admin-storefront-lead">
                  These seven permanent product lines stay on the homepage. Edit titles, copy, photos, or hide a tile —
                  links stay fixed to each collection.
                </p>
              </div>
            </div>
            {shopCategories.length === 0 ? (
              <p className="admin-orders-empty">No homepage categories. Add one to show tiles on the live shop.</p>
            ) : (
            <div className="admin-storefront-groups">
              {shopCategories.map((item, index) => (
                <div key={item.id} className={`admin-storefront-group${item.hidden ? " is-hidden" : ""}`}>
                  <input type="hidden" name={`categoryId_${index}`} value={item.id} />
                  <input type="hidden" name={`categoryHref_${index}`} value={item.href} />
                  <div className="admin-storefront-head">
                    <input type="hidden" name={`categoryHidden_${index}`} value={item.hidden ? "1" : "0"} />
                    <label className="admin-storefront-hide">
                      <input
                        type="checkbox"
                        checked={item.hidden}
                        onChange={(event) => {
                          const hidden = event.target.checked;
                          // Sync before React re-renders so Publish right after click still saves.
                          const field = event.currentTarget.form?.elements.namedItem(`categoryHidden_${index}`);
                          if (field instanceof HTMLInputElement) {
                            field.value = hidden ? "1" : "0";
                          }
                          setShopCategories((current) =>
                            current.map((entry) => (entry.id === item.id ? { ...entry, hidden } : entry)),
                          );
                        }}
                      />
                      Hide
                    </label>
                    <p className="admin-product-kicker">Collection: {item.href}</p>
                  </div>
                  <div className="admin-product-fields">
                    <SoftInput label="Title" name={`categoryTitle_${index}`} defaultValue={item.title} />
                    <div className="admin-product-field">
                      <label className="admin-product-label" htmlFor={`categoryIcon_${index}`}>
                        Icon
                      </label>
                      <select
                        id={`categoryIcon_${index}`}
                        className="admin-product-soft admin-product-select"
                        name={`categoryIcon_${index}`}
                        defaultValue={item.icon}
                      >
                        {SHOP_CATEGORY_ICONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                    <SoftInput
                      label="Description"
                      name={`categoryDescription_${index}`}
                      defaultValue={item.description}
                    />
                  </div>
                  <ImageUrlField
                    name={`categoryImage_${index}`}
                    label="Tile image"
                    defaultValue={item.image}
                  />
                  <ColorField
                    name={`categoryColor_${index}`}
                    label="Backdrop"
                    defaultValue={item.color}
                    presets={tilePresets}
                  />
                </div>
              ))}
            </div>
            )}
          </section>
          <section className="admin-product-card" aria-labelledby="storefront-collections-heading">
            <h2 id="storefront-collections-heading" className="admin-product-card-title">
              Collection heroes
            </h2>
            <div className="admin-storefront-groups">
              {Object.keys(content.collectionImages).map((key) => (
                <div key={key} className="admin-storefront-group">
                  <MediaUrlField
                    name={`collectionImage_${key}`}
                    label={`${COLLECTION_LABELS[key] ?? key} hero`}
                    defaultValue={content.collectionImages[key] ?? ""}
                    defaultPoster={content.collectionImagePosters[key] ?? ""}
                    hint="Tall photo, product cutout (PNG), or video for the arched frame. Videos include a cover automatically."
                  />
                  <div className="admin-product-fields">
                    <SoftInput
                      label="First word"
                      name={`collectionFirst_${key}`}
                      defaultValue={content.collectionTitles[key]?.first ?? ""}
                    />
                    <SoftInput
                      label="Second word"
                      name={`collectionSecond_${key}`}
                      defaultValue={content.collectionTitles[key]?.second ?? ""}
                    />
                  </div>
                  <SoftArea
                    label="Intro"
                    name={`collectionSeoIntro_${key}`}
                    rows={3}
                    defaultValue={content.collectionSeo[key]?.intro ?? ""}
                  />
                  <div className="admin-product-fields">
                    <SoftInput
                      label="SEO title"
                      name={`collectionSeoTitle_${key}`}
                      defaultValue={content.collectionSeo[key]?.metaTitle ?? ""}
                    />
                    <SoftInput
                      label="SEO description"
                      name={`collectionSeoDescription_${key}`}
                      defaultValue={content.collectionSeo[key]?.metaDescription ?? ""}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-product-card" aria-labelledby="storefront-matching-looks-heading">
            <div className="admin-storefront-head">
              <div>
                <h2 id="storefront-matching-looks-heading" className="admin-product-card-title">
                  Matching Looks
                </h2>
                <p className="admin-product-kicker admin-storefront-lead">
                  Curated outfit cards for Matching Sets. Leave empty to hide looks on the storefront. Product cards
                  resolve live prices and stock.
                </p>
              </div>
              <button type="button" className="admin-product-ghost" onClick={addMatchingLook} disabled={matchingLooks.length >= 40}>
                Add look
              </button>
            </div>
            <input type="hidden" name="matchingLooksCount" value={matchingLooks.length} />
            {matchingLooks.length === 0 ? (
              <p className="admin-orders-empty">No looks yet. Add one to feature curated outfits on Matching Sets.</p>
            ) : (
              <div className="admin-storefront-groups">
                {matchingLooks.map((look, index) => (
                  <div key={look.id} className="admin-storefront-group">
                    <div className="admin-storefront-head">
                      <label className="admin-storefront-hide">
                        <input
                          type="checkbox"
                          name={`matchingLookPublished_${index}`}
                          defaultChecked={look.published}
                        />
                        Published
                      </label>
                      <button
                        type="button"
                        className="admin-product-delete"
                        onClick={() => setMatchingLooks((current) => current.filter((entry) => entry.id !== look.id))}
                      >
                        Delete
                      </button>
                    </div>
                    <input type="hidden" name={`matchingLookId_${index}`} value={look.id} />
                    <div className="admin-product-fields">
                      <SoftInput label="Title" name={`matchingLookTitle_${index}`} defaultValue={look.title} />
                      <SoftInput label="Slug" name={`matchingLookSlug_${index}`} defaultValue={look.slug} />
                    </div>
                    <SoftArea
                      label="Description"
                      name={`matchingLookDescription_${index}`}
                      rows={2}
                      defaultValue={look.description}
                    />
                    <SoftInput
                      label="Cover image URL"
                      name={`matchingLookCoverSrc_${index}`}
                      defaultValue={look.coverSrc}
                      hint="Optional. Leave blank to use the first product image on the storefront."
                    />
                    <SoftInput
                      label="Product IDs (comma-separated)"
                      name={`matchingLookProductIds_${index}`}
                      defaultValue={look.productIds.join(", ")}
                      hint="Paste product IDs from the product editor URL or admin product list (not SKUs)."
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="admin-storefront-stack" hidden={tab !== "nav"}>
          <section className="admin-product-card" aria-labelledby="storefront-nav-heading">
            <div className="admin-storefront-head">
              <div>
                <h2 id="storefront-nav-heading" className="admin-product-card-title">
                  Header and footer links
                </h2>
                <p className="admin-product-kicker admin-storefront-lead">
                  Edit labels and paths, hide a link from the live shop, or delete it. Publish to apply.
                </p>
              </div>
              <button
                type="button"
                className="admin-product-ghost"
                onClick={addNavLink}
                disabled={navLinks.length >= 12}
              >
                Add link
              </button>
            </div>
            {navLinks.length === 0 ? (
              <p className="admin-orders-empty">No nav links. Add one for the header and footer Shop group.</p>
            ) : (
              <div className="admin-storefront-groups">
                {navLinks.map((item, index) => (
                  <div key={item.id} className={`admin-storefront-group${item.hidden ? " is-hidden" : ""}`}>
                    <input type="hidden" name={`navId_${index}`} value={item.id} />
                    <div className="admin-storefront-head">
                      <input type="hidden" name={`navHidden_${index}`} value={item.hidden ? "1" : "0"} />
                      <label className="admin-storefront-hide">
                        <input
                          type="checkbox"
                          checked={item.hidden}
                          onChange={(event) => {
                            const hidden = event.target.checked;
                            const field = event.currentTarget.form?.elements.namedItem(`navHidden_${index}`);
                            if (field instanceof HTMLInputElement) {
                              field.value = hidden ? "1" : "0";
                            }
                            setNavLinks((current) =>
                              current.map((entry) => (entry.id === item.id ? { ...entry, hidden } : entry)),
                            );
                          }}
                        />
                        Hide
                      </label>
                      <button
                        type="button"
                        className="admin-product-delete"
                        onClick={() => setNavLinks((current) => current.filter((entry) => entry.id !== item.id))}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="admin-product-fields">
                      <SoftInput label="Label" name={`navLabel_${index}`} defaultValue={item.label} />
                      <SoftInput
                        label="Path"
                        name={`navPath_${index}`}
                        defaultValue={item.path}
                        hint="Must start with /"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {MEGA_MENU_IDS.map((menuId) => {
            const mega = content.megaMenus[menuId];
            return (
              <section
                key={menuId}
                className="admin-product-card"
                aria-labelledby={`storefront-mega-${menuId}-heading`}
              >
                <h2 id={`storefront-mega-${menuId}-heading`} className="admin-product-card-title">
                  {MEGA_MENU_LABELS[menuId]}
                </h2>
                <p className="admin-product-kicker admin-storefront-lead">
                  Desktop hover panel — headline plus four featured image cards.
                </p>
                <div className="admin-product-fields">
                  <SoftInput
                    label="Headline"
                    name={`megaHeadline_${menuId}`}
                    defaultValue={mega.headline}
                  />
                </div>
                <div className="admin-storefront-groups">
                  {mega.cards.map((card, index) => (
                    <div key={card.id} className="admin-storefront-group">
                      <input type="hidden" name={`megaCardId_${menuId}_${index}`} value={card.id} />
                      <p className="admin-product-label">Card {index + 1}</p>
                      <div className="admin-product-fields">
                        <ImageUrlField
                          name={`megaCardImage_${menuId}_${index}`}
                          label="Image"
                          defaultValue={card.image}
                        />
                        <SoftInput
                          label="Label"
                          name={`megaCardLabel_${menuId}_${index}`}
                          defaultValue={card.label}
                        />
                        <SoftInput
                          label="Path"
                          name={`megaCardHref_${menuId}_${index}`}
                          defaultValue={card.href}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="admin-product-card" hidden={tab !== "bestsellers"} aria-labelledby="storefront-sellers-heading">
          <h2 id="storefront-sellers-heading" className="admin-product-card-title">
            Best sellers
          </h2>
          <p className="admin-product-kicker admin-storefront-lead">
            Pick three published products. Title, price, and photo come from inventory.
          </p>
          {catalog.length === 0 ? (
            <>
              <p className="admin-orders-empty">Publish products in Inventory first.</p>
              <input type="hidden" name="bestSellerSku1" value={content.bestSellerSkus[0] ?? ""} />
              <input type="hidden" name="bestSellerSku2" value={content.bestSellerSkus[1] ?? ""} />
              <input type="hidden" name="bestSellerSku3" value={content.bestSellerSkus[2] ?? ""} />
              <input type="hidden" name="bestSellerColor1" value={content.bestSellerColors[0] ?? PRODUCT_CARD_COATS[0]!} />
              <input type="hidden" name="bestSellerColor2" value={content.bestSellerColors[1] ?? PRODUCT_CARD_COATS[1]!} />
              <input type="hidden" name="bestSellerColor3" value={content.bestSellerColors[2] ?? PRODUCT_CARD_COATS[2]!} />
            </>
          ) : (
            <div className="admin-product-fields">
              <SkuSelect label="Slot 1" name="bestSellerSku1" value={content.bestSellerSkus[0] ?? ""} catalog={catalog} />
              <ColorField
                name="bestSellerColor1"
                label="Slot 1 backdrop"
                defaultValue={content.bestSellerColors[0] ?? PRODUCT_CARD_COATS[0]!}
                presets={tilePresets}
              />
              <SkuSelect label="Slot 2" name="bestSellerSku2" value={content.bestSellerSkus[1] ?? ""} catalog={catalog} />
              <ColorField
                name="bestSellerColor2"
                label="Slot 2 backdrop"
                defaultValue={content.bestSellerColors[1] ?? PRODUCT_CARD_COATS[1]!}
                presets={tilePresets}
              />
              <SkuSelect label="Slot 3" name="bestSellerSku3" value={content.bestSellerSkus[2] ?? ""} catalog={catalog} />
              <ColorField
                name="bestSellerColor3"
                label="Slot 3 backdrop"
                defaultValue={content.bestSellerColors[2] ?? PRODUCT_CARD_COATS[2]!}
                presets={tilePresets}
              />
            </div>
          )}
        </section>

        <div className="admin-storefront-stack" hidden={tab !== "copy"}>
          <section className="admin-product-card" aria-labelledby="storefront-story-heading">
            <h2 id="storefront-story-heading" className="admin-product-card-title">
              Brand story
            </h2>
            <div className="admin-product-fields">
              <SoftInput label="Story lead" name="brandStoryLead" defaultValue={content.brandStoryLead} />
              <SoftInput label="Story mid" name="brandStoryMid" defaultValue={content.brandStoryMid} />
              <SoftArea label="Story end" name="brandStoryEnd" rows={3} defaultValue={content.brandStoryEnd} />
            </div>
          </section>
          <section className="admin-product-card" aria-labelledby="storefront-features-heading">
            <h2 id="storefront-features-heading" className="admin-product-card-title">
              Features
            </h2>
            <div className="admin-storefront-groups">
              {content.features.map((feature, index) => {
                const icons = FEATURE_ICONS.includes(feature.icon as (typeof FEATURE_ICONS)[number])
                  ? FEATURE_ICONS
                  : ([feature.icon, ...FEATURE_ICONS] as readonly string[]);
                return (
                  <div key={`feature-${index}`} className="admin-storefront-group">
                    <SoftInput
                      label={`Feature ${index + 1} title`}
                      name={`featureTitle_${index}`}
                      defaultValue={feature.title}
                    />
                    <SoftArea
                      label="Description"
                      name={`featureDescription_${index}`}
                      rows={3}
                      defaultValue={feature.description}
                    />
                    <div className="admin-product-field">
                      <label className="admin-product-label" htmlFor={`featureIcon_${index}`}>
                        Icon
                      </label>
                      <select
                        id={`featureIcon_${index}`}
                        name={`featureIcon_${index}`}
                        className="admin-product-soft admin-product-select"
                        defaultValue={feature.icon}
                      >
                        {icons.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="admin-product-card" aria-labelledby="storefront-faq-heading">
            <h2 id="storefront-faq-heading" className="admin-product-card-title">
              FAQ
            </h2>
            <p className="admin-product-kicker admin-storefront-lead">
              Edit questions and answers here. Change the FAQ photo under Homepage → Homepage images.
            </p>
            <div className="admin-storefront-groups admin-storefront-groups--tight">
              {Array.from({ length: Math.max(content.faqItems.length, 4) }, (_, index) => {
                const item = content.faqItems[index] ?? {
                  id: `faq-${index + 1}`,
                  question: "",
                  answer: "",
                };
                return (
                  <div key={`${item.id}-${index}`} className="admin-storefront-group">
                    <input type="hidden" name={`faqId_${index}`} value={item.id} />
                    <SoftInput label={`Question ${index + 1}`} name={`faqQuestion_${index}`} defaultValue={item.question} />
                    <SoftArea label="Answer" name={`faqAnswer_${index}`} rows={4} defaultValue={item.answer} />
                  </div>
                );
              })}
            </div>
          </section>
          <section className="admin-product-card" aria-labelledby="storefront-pages-heading">
            <h2 id="storefront-pages-heading" className="admin-product-card-title">
              Pages, footer, social
            </h2>
            <div className="admin-product-fields">
              <SoftArea label="About copy" name="aboutCopy" rows={4} defaultValue={content.aboutCopy} />
              <SoftArea label="Contact lead" name="contactLead" rows={3} defaultValue={content.contactLead} />
              <SoftInput
                label="WhatsApp / shop phone"
                name="supportPhone"
                defaultValue={content.supportPhone}
                hint="Primary WhatsApp, e.g. 03214433514. Contact page also lists +1 726 233 4805."
              />
              <SoftInput
                label="Footer statement lead"
                name="footerStatementLead"
                defaultValue={content.footerStatementLead}
              />
              <SoftInput
                label="Footer statement end"
                name="footerStatementEnd"
                defaultValue={content.footerStatementEnd}
              />
              <SoftInput label="Facebook URL" name="socialFacebook" defaultValue={content.socialFacebook} />
              <SoftInput label="Instagram URL" name="socialInstagram" defaultValue={content.socialInstagram} />
              <SoftInput label="Pinterest URL" name="socialPinterest" defaultValue={content.socialPinterest} />
              <ImageUrlField name="authLoginSrc" label="Login banner" defaultValue={content.authLoginSrc} />
              <ImageUrlField name="authRegisterSrc" label="Register banner" defaultValue={content.authRegisterSrc} />
              <ImageUrlField name="authAdminSrc" label="Admin login banner" defaultValue={content.authAdminSrc} />
            </div>
          </section>
        </div>

        <section className="admin-product-card" hidden={tab !== "checkout"} aria-labelledby="storefront-checkout-heading">
          <h2 id="storefront-checkout-heading" className="admin-product-card-title">
            Checkout fees
          </h2>
          <div className="admin-product-fields">
            <CurrencyField defaultValue={commerce.currency} />
            <SoftInput
              label="Standard shipping fee"
              name="standardShippingFee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={commerce.standardShippingFee}
            />
            <SoftInput
              label="Free shipping threshold"
              name="freeShippingThreshold"
              type="number"
              min="0"
              step="0.01"
              defaultValue={commerce.freeShippingThreshold}
            />
            <SoftInput label="Tax rate" name="taxRate" type="number" min="0" defaultValue={commerce.taxRate} />
            <SoftInput label="Tax label" name="taxLabel" defaultValue={commerce.taxLabel} />
            <fieldset className="admin-product-field admin-product-field--full">
              <legend className="admin-product-label">Options</legend>
              <div className="admin-product-radios">
                <label className="admin-product-radio">
                  <input type="checkbox" name="freeShippingEnabled" defaultChecked={commerce.freeShippingEnabled} />
                  Free shipping enabled
                </label>
                <label className="admin-product-radio">
                  <input type="checkbox" name="taxEnabled" defaultChecked={commerce.taxEnabled} />
                  Tax enabled
                </label>
              </div>
            </fieldset>
          </div>
        </section>
      </form>
    </UnsavedGuard>
    </AdminUploadBusyProvider>
  );
}
