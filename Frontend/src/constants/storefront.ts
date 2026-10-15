import type { CSSProperties } from "react";

import {
  brandName,
  brandStoryEnd,
  brandStoryLead,
  brandStoryMid,
  brandStoryPortraitSrc,
  brandStoryPrimarySrc,
  brandStorySecondarySrc,
  footerStatementEnd,
  footerStatementLead,
  heroHeadline,
  heroProductAlt,
  heroProductSrc,
  heroSupport,
  heroVideoMobileSrc,
  heroVideoPosterSrc,
  heroVideoSrc,
} from "@/constants/brand";
import { MENSWEAR } from "@/constants/menswear-assets";
import { MEGA_FEATURED } from "@/constants/navigation-ia";
import {
  AUTH_BANNERS,
  BEST_SELLERS,
  COLLECTION_HEROES,
  FEATURES,
  FOOTER_SOCIAL,
  GLOW_STATS_IMAGE,
  HOME_FAQ,
  HOME_FAQ_IMAGE,
  HOME_FAQ_IMAGE_ALT,
  NAV_ITEMS,
  PRODUCT_HIGHLIGHTS_IMAGE,
  SHOP_RANGE_CATEGORIES,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_LOCAL,
} from "@/constants/site";
import { resolvePublicAssetSrc } from "@/lib/public-assets";

export type StorefrontTheme = {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  mint: string;
  blush: string;
};

export type StorefrontFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type StorefrontFeature = {
  title: string;
  description: string;
  icon: string;
};

export type StorefrontCollectionTitle = {
  first: string;
  second: string;
};

export type StorefrontNavLink = {
  id: string;
  label: string;
  path: string;
  hidden: boolean;
};

export type StorefrontShopCategory = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  alt: string;
  icon: string;
  color: string;
  hidden: boolean;
};

export const MEGA_MENU_IDS = ["navShop", "navCustom", "navDisciplines"] as const;
export type MegaMenuId = (typeof MEGA_MENU_IDS)[number];

export type StorefrontMegaCard = {
  id: string;
  label: string;
  href: string;
  image: string;
};

export type StorefrontMegaMenu = {
  headline: string;
  cards: StorefrontMegaCard[];
};

export type StorefrontCustomTackOption = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type StorefrontCustomTack = {
  title: string;
  titleAccent: string;
  lead: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
  options: StorefrontCustomTackOption[];
};

export type StorefrontDisciplineItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type StorefrontDisciplinesSection = {
  title: string;
  titleMark: string;
  support: string;
  ctaLabel: string;
  ctaHref: string;
  items: StorefrontDisciplineItem[];
};

export type StorefrontRiderGalleryTone = "warm" | "mint" | "photo";

export type StorefrontRiderGalleryItem = {
  id: string;
  src: string;
  /** Cover image when `src` is a video. */
  poster?: string;
  alt: string;
  label: string;
  href: string;
  tone: StorefrontRiderGalleryTone;
};

export type StorefrontRiderGallery = {
  title: string;
  titleMark: string;
  lead: string;
  ctaLabel: string;
  ctaHref: string;
  items: StorefrontRiderGalleryItem[];
};

export type StorefrontMatchingLook = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverSrc: string;
  productIds: string[];
  published: boolean;
  sortOrder: number;
};

export type StorefrontCollectionSeo = {
  intro: string;
  metaTitle: string;
  metaDescription: string;
};

export const SHOP_CATEGORY_ICONS = ["saddle", "bridle", "halter", "leather", "horseshoe", "stitch"] as const;

/** Orbit slots around the product-highlights hero (CSS modifiers keep legacy ids). */
export const PRODUCT_HIGHLIGHTS_FLOAT_SLOTS = [
  { id: "seeds", label: "Bottom left", size: 96 },
  { id: "slice", label: "Top right", size: 68 },
  { id: "leaf", label: "Top left", size: 80 },
  { id: "petal", label: "Bottom right", size: 72 },
  { id: "droplet", label: "Top center", size: 54 },
] as const;

export type ProductHighlightsFloatId = (typeof PRODUCT_HIGHLIGHTS_FLOAT_SLOTS)[number]["id"];

export type StorefrontContent = {
  heroHeadline: string;
  heroSupport: string;
  heroProductSrc: string;
  heroProductAlt: string;
  /** Homepage hero cutout: stacked-alpha MP4 (colour over matte). A plain clip is converted on API start. */
  heroVideoSrc: string;
  /** The same render at phone size. */
  heroVideoMobileSrc: string;
  /** The render's first frame as a transparent WebP; paints before the video. */
  heroVideoPosterSrc: string;
  brandStoryPrimarySrc: string;
  brandStorySecondarySrc: string;
  brandStoryPortraitSrc: string;
  brandStoryLead: string;
  brandStoryMid: string;
  brandStoryEnd: string;
  productHighlightsImage: string;
  /** Cut-outs that drift around the product-highlights hero. Keys match CSS float modifiers. */
  productHighlightsFloats: Record<ProductHighlightsFloatId, string>;
  glowStatsImage: string;
  faqImage: string;
  faqImageAlt: string;
  faqItems: StorefrontFaqItem[];
  features: StorefrontFeature[];
  footerStatementLead: string;
  footerStatementEnd: string;
  socialFacebook: string;
  socialInstagram: string;
  socialPinterest: string;
  aboutCopy: string;
  contactLead: string;
  /** Shop WhatsApp / contact phone (local or E.164). */
  supportPhone: string;
  authLoginSrc: string;
  authRegisterSrc: string;
  authAdminSrc: string;
  shopImages: Record<string, string>;
  shopCardColors: Record<string, string>;
  collectionImages: Record<string, string>;
  /** Cover frames for collection hero videos (same keys as collectionImages). */
  collectionImagePosters: Record<string, string>;
  collectionTitles: Record<string, StorefrontCollectionTitle>;
  /** Per-collection intro + SEO (admin-editable). */
  collectionSeo: Record<string, StorefrontCollectionSeo>;
  bestSellerSkus: string[];
  bestSellerColors: string[];
  heroStageColor: string;
  productCardColors: string[];
  navLinks: StorefrontNavLink[];
  shopCategories: StorefrontShopCategory[];
  megaMenus: Record<MegaMenuId, StorefrontMegaMenu>;
  customTack: StorefrontCustomTack;
  disciplinesSection: StorefrontDisciplinesSection;
  riderGallery: StorefrontRiderGallery;
  /** Curated matching looks — product IDs resolve live on the storefront. */
  matchingLooks: StorefrontMatchingLook[];
};

export const DEFAULT_STOREFRONT_THEME: StorefrontTheme = {
  bg: "#f4f1eb",
  primary: "#69262B",
  secondary: "#8e8a86",
  accent: "#d0d5d2",
  mint: "#d0d5d2",
  blush: "#eceae4",
};

/** Soft fills for category and product cards — maroon / beige / silver family. */
export const HORSE_COAT = {
  /** Taupe-silver secondary. */
  dappleGrey: "#8e8a86",
  /** Hero silver accent. */
  sorrel: "#d0d5d2",
  /** Soft cool silver. */
  blueRoan: "#c5c9cc",
} as const;

export const CATEGORY_DAPPLE_GREY = HORSE_COAT.dappleGrey;
export const CATEGORY_SORREL = HORSE_COAT.sorrel;
export const PRODUCT_CARD_COATS = [HORSE_COAT.sorrel, HORSE_COAT.dappleGrey, HORSE_COAT.blueRoan];

const LEGACY_HORSE_COLORS: Record<string, string> = {
  "#d5e4cf": HORSE_COAT.dappleGrey,
  "#f0c5bf": HORSE_COAT.sorrel,
  "#daae00": HORSE_COAT.sorrel,
  "#efe4ee": HORSE_COAT.blueRoan,
  "#96976c": HORSE_COAT.dappleGrey,
  "#c8c6bc": HORSE_COAT.dappleGrey,
  "#d9b0a2": HORSE_COAT.sorrel,
  "#8f9d6e": HORSE_COAT.dappleGrey,
  "#b7c49a": HORSE_COAT.dappleGrey,
  /* Previous terracotta / brown coats → silver–taupe */
  "#959486": HORSE_COAT.dappleGrey,
  "#c15a3a": HORSE_COAT.sorrel,
  "#7a8896": HORSE_COAT.blueRoan,
  "#3a221c": DEFAULT_STOREFRONT_THEME.primary,
  "#6b2f22": DEFAULT_STOREFRONT_THEME.primary,
  "#4a2219": DEFAULT_STOREFRONT_THEME.primary,
  /* Previous lime / sage coats */
  "#e1e53f": HORSE_COAT.sorrel,
  "#c8cc2e": HORSE_COAT.sorrel,
  "#859361": HORSE_COAT.dappleGrey,
  "#a8c5c1": HORSE_COAT.blueRoan,
};

function categoryCardColor(index: number): string {
  return PRODUCT_CARD_COATS[index % PRODUCT_CARD_COATS.length]!;
}

export function resolveHorseCoatColor(value: string | null | undefined, fallback: string): string {
  const hex = String(value ?? "").trim().toLowerCase();
  if (!hex) {
    return fallback;
  }
  return LEGACY_HORSE_COLORS[hex] ?? hex;
}

function resolveCategoryCardColor(value: string, fallback: string): string {
  return resolveHorseCoatColor(value, fallback);
}

export const DEFAULT_NAV_LINKS: StorefrontNavLink[] = NAV_ITEMS.map((item) => ({
  id: item.id,
  label: item.label,
  path: item.path,
  hidden: false,
}));

export const DEFAULT_SHOP_CATEGORIES: StorefrontShopCategory[] = SHOP_RANGE_CATEGORIES.map((item, index) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  href: item.href,
  image: item.image,
  alt: item.alt,
  icon: item.icon,
  color: categoryCardColor(index),
  hidden: false,
}));

const MEGA_IMAGE_BY_KEY: Record<string, string> = {
  ...Object.fromEntries(DEFAULT_SHOP_CATEGORIES.map((item) => [item.id, item.image])),
  ...Object.fromEntries(Object.entries(COLLECTION_HEROES).map(([key, value]) => [key, value.image])),
  all: MENSWEAR.collection,
};

function megaImageForKey(imageKey: string): string {
  return MEGA_IMAGE_BY_KEY[imageKey] || MENSWEAR.collection;
}

export const DEFAULT_MEGA_MENUS: Record<MegaMenuId, StorefrontMegaMenu> = {
  navShop: MEGA_FEATURED.navShop
    ? {
        headline: MEGA_FEATURED.navShop.headline,
        cards: MEGA_FEATURED.navShop.cards.map((card) => ({
          id: card.id,
          label: card.label,
          href: card.href,
          image: megaImageForKey(card.imageKey),
        })),
      }
    : { headline: "", cards: [] },
  navCustom: { headline: "", cards: [] },
  navDisciplines: { headline: "", cards: [] },
};

/** Homepage customization board (OAK & REIN–style forest panel, menswear copy). */
export const DEFAULT_CUSTOM_TACK: StorefrontCustomTack = {
  title: "Made for your look.",
  titleAccent: "Made your way.",
  lead: "Choose fabrics, colors, fits, personalization and details. Our atelier shapes each piece to match your vision.",
  image: MENSWEAR.highlights,
  ctaLabel: "Start Customizing",
  ctaHref: "/contact",
  options: [
    {
      id: "colors",
      title: "Custom Colors",
      description: "Choose a colorway that reflects your style.",
      href: "/collections/all",
    },
    {
      id: "engraving",
      title: "Monogram & Detail",
      description: "Add personalized embroidery and finishing touches.",
      href: "/contact",
    },
    {
      id: "name-logo",
      title: "Name & Logo",
      description: "Personalize select pieces with a name, initials or mark.",
      href: "/contact",
    },
    {
      id: "matching",
      title: "Matching Sets",
      description: "Create a coordinated blazer, shirt, trousers and footwear look.",
      href: "/collections/matching-pairs",
    },
  ],
};

export const DEFAULT_DISCIPLINES_SECTION: StorefrontDisciplinesSection = {
  title: "",
  titleMark: "",
  support: "",
  ctaLabel: "",
  ctaHref: "/collections/all",
  items: [],
};

export const DEFAULT_RIDER_GALLERY: StorefrontRiderGallery = {
  title: "The MUSAFIR",
  titleMark: "look",
  lead: "Contemporary menswear for office, events and evenings — explore the pieces that define the MUSAFIR look.",
  ctaLabel: "Shop the Collection",
  ctaHref: "/collections/all",
  items: [
    {
      id: "look-01",
      src: MENSWEAR.look01,
      alt: "MUSAFIR black blazer with turtleneck",
      label: "Evening Blazer",
      href: "/collections/coats-blazers",
      tone: "photo",
    },
    {
      id: "look-02",
      src: MENSWEAR.look02,
      alt: "MUSAFIR black double-breasted suit",
      label: "Black Suit",
      href: "/collections/coats-blazers",
      tone: "photo",
    },
    {
      id: "look-03",
      src: MENSWEAR.look03,
      alt: "MUSAFIR formal black suit look",
      label: "Formal Set",
      href: "/collections/matching-pairs",
      tone: "photo",
    },
    {
      id: "look-04",
      src: MENSWEAR.look04,
      alt: "MUSAFIR smart casual black jacket look",
      label: "Smart Casual",
      href: "/collections/new",
      tone: "photo",
    },
    {
      id: "look-05",
      src: MENSWEAR.look05,
      alt: "MUSAFIR editorial seated formal look",
      label: "Editorial",
      href: "/collections/shirts",
      tone: "photo",
    },
    {
      id: "look-06",
      src: MENSWEAR.look06,
      alt: "MUSAFIR charcoal suit with plum tie",
      label: "Charcoal Suit",
      href: "/collections/coats-blazers",
      tone: "photo",
    },
  ],
};

export const DEFAULT_STOREFRONT_CONTENT: StorefrontContent = {
  heroHeadline,
  heroSupport,
  heroProductSrc,
  heroProductAlt,
  heroVideoSrc,
  heroVideoMobileSrc,
  heroVideoPosterSrc,
  brandStoryPrimarySrc,
  brandStorySecondarySrc,
  brandStoryPortraitSrc,
  brandStoryLead,
  brandStoryMid,
  brandStoryEnd,
  productHighlightsImage: PRODUCT_HIGHLIGHTS_IMAGE,
  /** Floating side cutouts disabled for menswear layout. */
  productHighlightsFloats: {
    seeds: "",
    slice: "",
    leaf: "",
    petal: "",
    droplet: "",
  },
  glowStatsImage: GLOW_STATS_IMAGE,
  faqImage: HOME_FAQ_IMAGE,
  faqImageAlt: HOME_FAQ_IMAGE_ALT,
  faqItems: HOME_FAQ.map((item) => ({ id: item.id, question: item.question, answer: item.answer })),
  features: FEATURES.map((item) => ({ title: item.title, description: item.description, icon: item.icon })),
  footerStatementLead,
  footerStatementEnd,
  socialFacebook: FOOTER_SOCIAL.find((item) => item.id === "facebook")?.href ?? "https://facebook.com/musafir",
  socialInstagram: FOOTER_SOCIAL.find((item) => item.id === "instagram")?.href ?? "https://instagram.com/musafir",
  socialPinterest: FOOTER_SOCIAL.find((item) => item.id === "pinterest")?.href ?? "https://pinterest.com/musafir",
  aboutCopy: [
    "MUSAFIR is built around a simple idea: good style should feel natural, considered and entirely your own.",
    "",
    "What MUSAFIR Stands For",
    "The way we dress is part of how we show up in the world. At MUSAFIR, we see Pakistani menswear as more than a single outfit or occasion. It is about finding pieces that feel right for the office, family events and everyday life — and that work well together.",
    "Our collection brings together coats and blazers, formal shirts, trousers and footwear with a focus on modern silhouettes, versatile styling and a refined, understated aesthetic. Whether you're choosing one new piece or putting together a complete look, we want the process to feel clear and effortless.",
    "",
    "Everything Works Better Together",
    "A great outfit comes down to how the pieces connect. A well-chosen blazer can change the tone of a shirt. The right trousers add balance. Footwear brings the look together.",
    "That is why Matching Sets is part of MUSAFIR: curated combinations that help you discover complementary styles while still giving you the freedom to choose each piece for yourself.",
    "",
    "A Considered Approach to Clothing",
    "We value pieces that are easy to return to, details that are worth a closer look and styling that stays relevant beyond a single event. Our approach is straightforward: make it easier to discover menswear you feel good wearing across Pakistan.",
    "For fabric, fit and care, each product page provides the available item-specific information. We believe clarity matters as much as presentation.",
    "",
    "Wherever the day takes you, dress like yourself.",
  ].join("\n"),
  contactLead: `Questions about an order or a product? Email ${SUPPORT_EMAIL} or WhatsApp us — we are here to help.`,
  supportPhone: SUPPORT_PHONE_LOCAL,
  authLoginSrc: AUTH_BANNERS.login.src,
  authRegisterSrc: AUTH_BANNERS.register.src,
  authAdminSrc: AUTH_BANNERS.adminLogin.src,
  shopCategories: DEFAULT_SHOP_CATEGORIES,
  shopImages: Object.fromEntries(DEFAULT_SHOP_CATEGORIES.map((item) => [item.id, item.image])),
  shopCardColors: Object.fromEntries(DEFAULT_SHOP_CATEGORIES.map((item) => [item.id, item.color])),
  collectionImages: Object.fromEntries(Object.entries(COLLECTION_HEROES).map(([key, value]) => [key, value.image])),
  collectionImagePosters: Object.fromEntries(Object.keys(COLLECTION_HEROES).map((key) => [key, ""])),
  collectionTitles: Object.fromEntries(
    Object.entries(COLLECTION_HEROES).map(([key, value]) => [key, { first: value.first, second: value.second }]),
  ),
  collectionSeo: Object.fromEntries(
    Object.entries(COLLECTION_HEROES).map(([key, value]) => [
      key,
      { intro: value.intro, metaTitle: value.metaTitle, metaDescription: value.metaDescription },
    ]),
  ),
  bestSellerSkus: BEST_SELLERS.map((item) => item.sku),
  bestSellerColors: BEST_SELLERS.map((_, index) => PRODUCT_CARD_COATS[index % PRODUCT_CARD_COATS.length]!),
  heroStageColor: DEFAULT_STOREFRONT_THEME.mint,
  productCardColors: [...PRODUCT_CARD_COATS],
  navLinks: DEFAULT_NAV_LINKS,
  megaMenus: DEFAULT_MEGA_MENUS,
  customTack: DEFAULT_CUSTOM_TACK,
  disciplinesSection: DEFAULT_DISCIPLINES_SECTION,
  riderGallery: DEFAULT_RIDER_GALLERY,
  matchingLooks: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asHex(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(text) ? text : fallback;
}

function asText(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

/** Missing/null → fallback. Explicit empty string is kept so CMS clears persist. */
function asStoredText(value: unknown, fallback: string): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim();
}

function asAssetSrc(value: unknown, fallback: string): string {
  return resolvePublicAssetSrc(asStoredText(value, fallback));
}

function asBrandText(value: unknown, fallback: string): string {
  const text = asStoredText(value, fallback)
    .replace(/zermaé/gi, brandName)
    .replace(/zermae/gi, brandName)
    .replace(/saddlera/gi, brandName)
    .replace(/oak\s*&\s*rein/gi, brandName)
    .replace(/oakrein/gi, brandName);
  // Drop stale equestrian / North America CMS copy so Pakistan menswear defaults win.
  if (
    /\b(saddle|bridle|halter|equestrian|tack|pakistani leather|pakistani craft|premium leather|north american?|united states|canada|ships? to north america|secure shopping)\b/i.test(
      text,
    ) &&
    fallback.length > 0
  ) {
    return fallback;
  }
  return text;
}

function asCollectionSeo(value: unknown): Record<string, StorefrontCollectionSeo> {
  const fallback = DEFAULT_STOREFRONT_CONTENT.collectionSeo;
  const record = asRecord(value);
  const next: Record<string, StorefrontCollectionSeo> = { ...fallback };
  for (const key of Object.keys(fallback)) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
    const item = asRecord(record[key]);
    const current = fallback[key];
    if (!current) continue;
    next[key] = {
      intro: asBrandText(item.intro, current.intro),
      metaTitle: asBrandText(item.metaTitle, current.metaTitle),
      metaDescription: asBrandText(item.metaDescription, current.metaDescription),
    };
  }
  return next;
}

function asMatchingLooks(value: unknown): StorefrontMatchingLook[] {
  if (!Array.isArray(value)) {
    return DEFAULT_STOREFRONT_CONTENT.matchingLooks;
  }
  return value
    .map((item, index) => {
      const record = asRecord(item);
      const productIds = Array.isArray(record.productIds)
        ? record.productIds.map((id) => String(id).trim()).filter(Boolean).slice(0, 12)
        : [];
      const slug = asStoredText(record.slug, `look-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "");
      return {
        id: asStoredText(record.id, `look-${index + 1}`) || `look-${index + 1}`,
        title: asStoredText(record.title, ""),
        slug: slug || `look-${index + 1}`,
        description: asStoredText(record.description, ""),
        coverSrc: asAssetSrc(record.coverSrc, ""),
        productIds,
        published: asBool(record.published),
        sortOrder: Number.isFinite(Number(record.sortOrder)) ? Number(record.sortOrder) : index,
      };
    })
    .filter((item) => item.title && item.slug)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 40);
}

function asImageMap(value: unknown, fallback: Record<string, string>): Record<string, string> {
  const record = asRecord(value);
  const next = { ...fallback };
  for (const key of Object.keys(fallback)) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      continue;
    }
    next[key] = resolvePublicAssetSrc(String(record[key] ?? "").trim());
  }
  for (const key of Object.keys(next)) {
    next[key] = resolvePublicAssetSrc(next[key] ?? "");
  }
  return next;
}

function asHexMap(value: unknown, fallback: Record<string, string>): Record<string, string> {
  const record = asRecord(value);
  const next = { ...fallback };
  for (const key of Object.keys(fallback)) {
    next[key] = asHex(record[key], fallback[key] ?? DEFAULT_STOREFRONT_THEME.blush);
  }
  return next;
}

function asHexList(value: unknown, fallback: string[]): string[] {
  const source = Array.isArray(value) ? value : [];
  return fallback.map((item, index) => resolveHorseCoatColor(asHex(source[index], item), item));
}

function asBool(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  return text === "on" || text === "true" || text === "1" || text === "yes";
}

function asIcon(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return (SHOP_CATEGORY_ICONS as readonly string[]).includes(text) ? text : fallback;
}

function asNavLinks(value: unknown): StorefrontNavLink[] {
  if (!Array.isArray(value)) {
    return DEFAULT_NAV_LINKS;
  }
  const links = value.slice(0, 12).map((item, index) => {
    const record = asRecord(item);
    const fallback = DEFAULT_NAV_LINKS[index] ?? { id: `nav-${index + 1}`, label: "Shop", path: "/collections/all", hidden: false };
    const id = asText(record.id, fallback.id);
    let label = asText(record.label, fallback.label);
    if (id === "navPairs" && /\bpairs?\b/i.test(label)) {
      label = fallback.label;
    }
    return {
      id,
      label,
      path: asPath(record.path, fallback.path),
      hidden: asBool(record.hidden),
    };
  }).filter((item) => item.label && item.path);

  if (links.length === 0) {
    return DEFAULT_NAV_LINKS;
  }

  const STALE_NAV_IDS = new Set([
    "navAll",
    "navSaddles",
    "navBridles",
    "navReins",
    "navCare",
    "navHalters",
    "navCustom",
    "navDisciplines",
    "navBestSellers",
    "navCraftsmanship",
    "navCoats",
    "navShirts",
    "navTrousers",
    "navShoes",
  ]);
  const looksEquestrian = links.some((link) =>
    /\b(saddle|bridle|tack|discipline)\b/i.test(`${link.label} ${link.path}`),
  );
  const hasShop = links.some((link) => link.id === "navShop");
  const isFlatApparel =
    !hasShop &&
    links.some((link) =>
      ["navCoats", "navShirts", "navTrousers", "navShoes", "navPairs", "navNew"].includes(link.id),
    );
  const onlyStale = links.every((link) => STALE_NAV_IDS.has(link.id));
  if (looksEquestrian || isFlatApparel || onlyStale) {
    return DEFAULT_NAV_LINKS;
  }

  return links;
}

function asPath(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  if (!text) {
    return fallback;
  }
  return text.startsWith("/") ? text : fallback;
}

function asMegaMenus(value: unknown): Record<MegaMenuId, StorefrontMegaMenu> {
  const record = asRecord(value);
  const next = { ...DEFAULT_MEGA_MENUS };
  for (const id of MEGA_MENU_IDS) {
    const fallback = DEFAULT_MEGA_MENUS[id];
    const section = asRecord(record[id]);
    const incomingCards = Array.isArray(section.cards) ? section.cards.map((item) => asRecord(item)) : [];
    if (fallback.cards.length === 0) {
      next[id] = fallback;
      continue;
    }
    if (incomingCards.length === 0) {
      next[id] = fallback;
      continue;
    }
    const merged = {
      headline: asBrandText(section.headline, fallback.headline),
      cards: fallback.cards.map((card, index) => {
        const raw = incomingCards[index] ?? {};
        let label = asStoredText(raw.label, card.label);
        if (
          (/\bpairs?\b/i.test(label) && /matching-pairs/.test(card.href)) ||
          (/^shoes$/i.test(label.trim()) && /\/shoes/.test(card.href)) ||
          (/^shirts$/i.test(label.trim()) && /\/shirts/.test(card.href))
        ) {
          label = card.label;
        }
        return {
          id: asStoredText(raw.id, card.id) || card.id,
          label,
          href: asPath(raw.href, card.href),
          image: resolvePublicAssetSrc(asStoredText(raw.image, card.image) || card.image),
        };
      }),
    };
    const blob = `${merged.headline} ${merged.cards.map((card) => `${card.label} ${card.href}`).join(" ")}`;
    if (/\b(saddle|bridle|halter|tack|discipline|engraved|western-saddles)\b/i.test(blob)) {
      next[id] = fallback;
      continue;
    }
    next[id] = merged;
  }
  return next;
}

function asCustomTack(value: unknown): StorefrontCustomTack {
  const record = asRecord(value);
  const fallback = DEFAULT_CUSTOM_TACK;
  const incoming = Array.isArray(record.options) ? record.options.map((item) => asRecord(item)) : [];
  const rawBlob = `${asStoredText(record.title, "")} ${asStoredText(record.titleAccent, "")} ${asStoredText(record.lead, "")} ${incoming
    .map((item) => `${asStoredText(item.title, "")} ${asStoredText(item.description, "")}`)
    .join(" ")}`;
  const staleCopy = /\b(saddle|bridle|tack|leather engraving|breast collar|reins|saddle pad|oak\s*&\s*rein|made for your ride)\b/i.test(
    rawBlob,
  );
  if (staleCopy || !asStoredText(record.title, "") || incoming.length === 0) {
    return {
      ...fallback,
      options: fallback.options.map((option) => ({ ...option })),
      image: resolvePublicAssetSrc(fallback.image),
    };
  }
  return {
    title: asBrandText(record.title, fallback.title),
    titleAccent: asBrandText(record.titleAccent, fallback.titleAccent),
    lead: asBrandText(record.lead, fallback.lead),
    image: resolvePublicAssetSrc(asStoredText(record.image, fallback.image) || fallback.image),
    ctaLabel: asStoredText(record.ctaLabel, fallback.ctaLabel) || fallback.ctaLabel,
    ctaHref: asPath(record.ctaHref, fallback.ctaHref),
    options: fallback.options.map((option, index) => {
      const raw = incoming[index] ?? {};
      return {
        id: asStoredText(raw.id, option.id) || option.id,
        title: asBrandText(raw.title, option.title),
        description: asBrandText(raw.description, option.description),
        href: asPath(raw.href, option.href),
      };
    }),
  };
}

/** Menswear storefront: equestrian disciplines section stays permanently disabled. */
function asDisciplinesSection(_value: unknown): StorefrontDisciplinesSection {
  return {
    ...DEFAULT_DISCIPLINES_SECTION,
    items: [...DEFAULT_DISCIPLINES_SECTION.items],
  };
}

function asRiderTone(value: unknown, fallback: StorefrontRiderGalleryTone): StorefrontRiderGalleryTone {
  const text = String(value ?? "").trim();
  return text === "warm" || text === "mint" || text === "photo" ? text : fallback;
}

function asRiderGallery(value: unknown): StorefrontRiderGallery {
  const record = asRecord(value);
  const fallback = DEFAULT_RIDER_GALLERY;
  const incoming = Array.isArray(record.items) ? record.items.map((item) => asRecord(item)) : [];
  const rawBlob = `${asStoredText(record.title, "")} ${asStoredText(record.titleMark, "")} ${asStoredText(record.lead, "")}`;
  const staleCopy = /\b(saddle|arena|trail|oak\s*&\s*rein|horse|bridle|tack|rider|seen in the)\b/i.test(rawBlob);
  if (staleCopy || incoming.length === 0) {
    return {
      ...fallback,
      items: fallback.items.map((item) => ({
        ...item,
        src: resolvePublicAssetSrc(item.src),
        poster: resolvePublicAssetSrc(item.poster ?? ""),
      })),
    };
  }
  return {
    title: asBrandText(record.title, fallback.title),
    titleMark: asBrandText(record.titleMark, fallback.titleMark),
    lead: asBrandText(record.lead, fallback.lead),
    ctaLabel: asStoredText(record.ctaLabel, fallback.ctaLabel) || fallback.ctaLabel,
    ctaHref: asPath(record.ctaHref, fallback.ctaHref),
    items: fallback.items.map((item, index) => {
      const raw = incoming[index] ?? {};
      const srcRaw = asStoredText(raw.src, item.src) || item.src;
      const staleSrc = /\b(horse|saddle|bridle|halter|tack|western_floral|hourse)\b/i.test(srcRaw);
      return {
        id: asStoredText(raw.id, item.id) || item.id,
        src: resolvePublicAssetSrc(staleSrc ? item.src : srcRaw),
        poster: resolvePublicAssetSrc(asStoredText(raw.poster, item.poster ?? "")),
        alt: asBrandText(raw.alt, item.alt),
        label: asBrandText(raw.label, item.label),
        href: asPath(raw.href, item.href),
        tone: asRiderTone(raw.tone, item.tone),
      };
    }),
  };
}

function asShopCategories(
  value: unknown,
  images: Record<string, string>,
  colors: Record<string, string>,
): StorefrontShopCategory[] {
  const incoming = Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter((record) => Object.keys(record).length > 0)
    : [];
  const byId = new Map(incoming.map((record) => [asText(record.id, ""), record]));

  // Permanent shop tiles always win — CMS may edit copy/images, never drop or reorder the set.
  return DEFAULT_SHOP_CATEGORIES.map((fallback) => {
    const record = byId.get(fallback.id) ?? {};
    const imageRaw = record.image;
    const image = resolvePublicAssetSrc(
      imageRaw === undefined || imageRaw === null
        ? images[fallback.id] || fallback.image
        : String(imageRaw).trim() || fallback.image,
    );
    const title = asBrandText(record.title, fallback.title);
    const description = asBrandText(record.description, fallback.description);
    const staleTitle =
      (fallback.id === "matching-pairs" && /\bpairs?\b/i.test(title)) ||
      (fallback.id === "shoes" && /^shoes$/i.test(title.trim())) ||
      (fallback.id === "shirts" && /^shirts$/i.test(title.trim()));
    return {
      id: fallback.id,
      title: staleTitle ? fallback.title : title,
      description,
      href: fallback.href,
      image,
      alt: asStoredText(record.alt, fallback.alt),
      icon: asIcon(record.icon, fallback.icon),
      color: resolveCategoryCardColor(
        asHex(record.color, colors[fallback.id] || fallback.color),
        fallback.color,
      ),
      hidden: asBool(record.hidden),
    };
  });
}

const LEGACY_THEME_COLORS: Record<string, string> = {
  "#96976c": DEFAULT_STOREFRONT_THEME.secondary,
  "#d5e4cf": DEFAULT_STOREFRONT_THEME.mint,
  "#f0c5bf": DEFAULT_STOREFRONT_THEME.blush,
  /* Previous terracotta / brown defaults → Vol palette */
  "#f5f2ee": DEFAULT_STOREFRONT_THEME.bg,
  "#3f3734": DEFAULT_STOREFRONT_THEME.primary,
  "#c4b6a6": DEFAULT_STOREFRONT_THEME.secondary,
  "#c15a3a": DEFAULT_STOREFRONT_THEME.accent,
  "#c8c6bc": DEFAULT_STOREFRONT_THEME.mint,
  "#d9b0a2": DEFAULT_STOREFRONT_THEME.blush,
  "#3a221c": DEFAULT_STOREFRONT_THEME.primary,
  "#6b2f22": DEFAULT_STOREFRONT_THEME.primary,
  "#4a2219": DEFAULT_STOREFRONT_THEME.primary,
  "#a94a2e": DEFAULT_STOREFRONT_THEME.accent,
  /* Previous forest green primary → maroon */
  "#204e4a": DEFAULT_STOREFRONT_THEME.primary,
  /* Previous lime / sage / yellow-blush → silver–taupe */
  "#e1e53f": DEFAULT_STOREFRONT_THEME.accent,
  "#c8cc2e": DEFAULT_STOREFRONT_THEME.mint,
  "#f3f5c8": DEFAULT_STOREFRONT_THEME.blush,
  "#859361": DEFAULT_STOREFRONT_THEME.secondary,
};

function resolveThemeColor(value: unknown, fallback: string): string {
  const hex = asHex(value, fallback).toLowerCase();
  return LEGACY_THEME_COLORS[hex] ?? hex;
}

export function resolveStorefrontTheme(raw: unknown): StorefrontTheme {
  const record = asRecord(raw);
  return {
    bg: resolveThemeColor(record.bg, DEFAULT_STOREFRONT_THEME.bg),
    primary: resolveThemeColor(record.primary, DEFAULT_STOREFRONT_THEME.primary),
    secondary: resolveThemeColor(record.secondary, DEFAULT_STOREFRONT_THEME.secondary),
    accent: resolveThemeColor(record.accent, DEFAULT_STOREFRONT_THEME.accent),
    mint: resolveThemeColor(record.mint, DEFAULT_STOREFRONT_THEME.mint),
    blush: resolveThemeColor(record.blush, DEFAULT_STOREFRONT_THEME.blush),
  };
}

function asFaqItems(value: unknown): StorefrontFaqItem[] {
  const fallback = DEFAULT_STOREFRONT_CONTENT.faqItems;
  if (!Array.isArray(value)) {
    return fallback;
  }
  const seen = new Set<string>();
  const items = value
    .map((item, index) => {
      const record = asRecord(item);
      const preferred = asText(record.id, fallback[index]?.id ?? `faq-${index + 1}`);
      let id = preferred;
      if (seen.has(id)) {
        id = `${preferred}-${index + 1}`;
      }
      seen.add(id);
      return {
        id,
        question: asBrandText(record.question, fallback[index]?.question ?? ""),
        answer: asBrandText(record.answer, fallback[index]?.answer ?? ""),
      };
    })
    .filter((item) => item.question && item.answer)
    .slice(0, 16);

  // Empty → defaults only. Keep shorter edited FAQ lists (do not revive full defaults).
  if (items.length === 0) {
    return fallback;
  }
  return items;
}

function asFeatures(value: unknown): StorefrontFeature[] {
  const fallback = DEFAULT_STOREFRONT_CONTENT.features;
  if (!Array.isArray(value)) {
    return fallback;
  }
  const items = value
    .map((item, index) => {
      const record = asRecord(item);
      return {
        title: asBrandText(record.title, fallback[index]?.title ?? ""),
        description: asBrandText(record.description, fallback[index]?.description ?? ""),
        icon: asText(record.icon, fallback[index]?.icon ?? "leather"),
      };
    })
    .filter((item) => item.title && item.description)
    .slice(0, 4);
  const stale = items.some((item) =>
    /\b(saddle|bridle|halter|equestrian|tack|premium leather|pakistani craft|north america|united states|canada)\b/i.test(
      `${item.title} ${item.description}`,
    ),
  );
  if (items.length === 0 || stale) {
    return fallback;
  }
  return items;
}

function asCollectionTitles(value: unknown): Record<string, StorefrontCollectionTitle> {
  const fallback = DEFAULT_STOREFRONT_CONTENT.collectionTitles;
  const record = asRecord(value);
  const next: Record<string, StorefrontCollectionTitle> = { ...fallback };
  for (const key of Object.keys(fallback)) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      continue;
    }
    const item = asRecord(record[key]);
    const current = fallback[key];
    if (!current) {
      continue;
    }
    const first = asBrandText(item.first, current.first);
    const second = asBrandText(item.second, current.second);
    // Prefer Pakistan menswear defaults over stale CMS titles (Pairs / Shoes / Men's Shirts).
    if (
      (key === "matching-pairs" && /\bpairs?\b/i.test(`${first} ${second}`)) ||
      (key === "shoes" && /^shoes$/i.test(second.trim())) ||
      (key === "shirts" && /^men'?s$/i.test(first.trim()) && /^shirts$/i.test(second.trim()))
    ) {
      next[key] = { first: current.first, second: current.second };
      continue;
    }
    next[key] = { first, second };
  }
  return next;
}

export function resolveStorefrontContent(raw: unknown): StorefrontContent {
  const record = asRecord(raw);
  const LEGACY_BEST_SELLER_SKUS: Record<string, string> = {
    "ZM-HAL-001": "ZM-SHO-001",
    "ZM-LUMIE-001": "ZM-SHO-001",
    "ZM-VITC-001": "ZM-SAD-001",
    "ZM-PDRN-001": "ZM-BRI-001",
  };
  const skus = (
    Array.isArray(record.bestSellerSkus)
      ? record.bestSellerSkus.map((item) => String(item).trim().toUpperCase()).filter(Boolean)
      : []
  )
    .map((sku) => LEGACY_BEST_SELLER_SKUS[sku] ?? sku)
    .slice(0, 3);
  const images = asImageMap(record.shopImages, DEFAULT_STOREFRONT_CONTENT.shopImages);
  const colors = asHexMap(record.shopCardColors, DEFAULT_STOREFRONT_CONTENT.shopCardColors);
  const shopCategories = asShopCategories(record.shopCategories, images, colors);
  const shopImages = Object.fromEntries(shopCategories.map((item) => [item.id, item.image]));
  const shopCardColors = Object.fromEntries(shopCategories.map((item) => [item.id, item.color]));
  return {
    heroHeadline: asStoredText(record.heroHeadline, DEFAULT_STOREFRONT_CONTENT.heroHeadline),
    heroSupport: asStoredText(record.heroSupport, DEFAULT_STOREFRONT_CONTENT.heroSupport),
    heroProductSrc: asAssetSrc(record.heroProductSrc, DEFAULT_STOREFRONT_CONTENT.heroProductSrc),
    heroProductAlt: asStoredText(record.heroProductAlt, DEFAULT_STOREFRONT_CONTENT.heroProductAlt),
    heroVideoSrc: asAssetSrc(record.heroVideoSrc, DEFAULT_STOREFRONT_CONTENT.heroVideoSrc),
    heroVideoMobileSrc: asAssetSrc(record.heroVideoMobileSrc, DEFAULT_STOREFRONT_CONTENT.heroVideoMobileSrc),
    heroVideoPosterSrc: asAssetSrc(record.heroVideoPosterSrc, DEFAULT_STOREFRONT_CONTENT.heroVideoPosterSrc),
    brandStoryPrimarySrc: asAssetSrc(record.brandStoryPrimarySrc, DEFAULT_STOREFRONT_CONTENT.brandStoryPrimarySrc),
    brandStorySecondarySrc: asAssetSrc(record.brandStorySecondarySrc, DEFAULT_STOREFRONT_CONTENT.brandStorySecondarySrc),
    brandStoryPortraitSrc: asAssetSrc(record.brandStoryPortraitSrc, DEFAULT_STOREFRONT_CONTENT.brandStoryPortraitSrc),
    brandStoryLead: asStoredText(record.brandStoryLead, DEFAULT_STOREFRONT_CONTENT.brandStoryLead),
    brandStoryMid: asStoredText(record.brandStoryMid, DEFAULT_STOREFRONT_CONTENT.brandStoryMid),
    brandStoryEnd: asStoredText(record.brandStoryEnd, DEFAULT_STOREFRONT_CONTENT.brandStoryEnd),
    productHighlightsImage: asAssetSrc(record.productHighlightsImage, DEFAULT_STOREFRONT_CONTENT.productHighlightsImage),
    productHighlightsFloats: { ...DEFAULT_STOREFRONT_CONTENT.productHighlightsFloats },
    glowStatsImage: asAssetSrc(record.glowStatsImage, DEFAULT_STOREFRONT_CONTENT.glowStatsImage),
    faqImage: asAssetSrc(record.faqImage, DEFAULT_STOREFRONT_CONTENT.faqImage),
    faqImageAlt: asStoredText(record.faqImageAlt, DEFAULT_STOREFRONT_CONTENT.faqImageAlt),
    faqItems: asFaqItems(record.faqItems),
    features: asFeatures(record.features),
    footerStatementLead: asBrandText(record.footerStatementLead, DEFAULT_STOREFRONT_CONTENT.footerStatementLead),
    footerStatementEnd: asBrandText(record.footerStatementEnd, DEFAULT_STOREFRONT_CONTENT.footerStatementEnd),
    socialFacebook: asStoredText(record.socialFacebook, DEFAULT_STOREFRONT_CONTENT.socialFacebook),
    socialInstagram: asStoredText(record.socialInstagram, DEFAULT_STOREFRONT_CONTENT.socialInstagram),
    socialPinterest: asStoredText(record.socialPinterest, DEFAULT_STOREFRONT_CONTENT.socialPinterest),
    aboutCopy: asBrandText(record.aboutCopy, DEFAULT_STOREFRONT_CONTENT.aboutCopy),
    contactLead: asStoredText(record.contactLead, DEFAULT_STOREFRONT_CONTENT.contactLead),
    supportPhone: asStoredText(record.supportPhone, DEFAULT_STOREFRONT_CONTENT.supportPhone),
    authLoginSrc: asAssetSrc(record.authLoginSrc, DEFAULT_STOREFRONT_CONTENT.authLoginSrc),
    authRegisterSrc: asAssetSrc(record.authRegisterSrc, DEFAULT_STOREFRONT_CONTENT.authRegisterSrc),
    authAdminSrc: asAssetSrc(record.authAdminSrc, DEFAULT_STOREFRONT_CONTENT.authAdminSrc),
    shopImages,
    shopCardColors,
    shopCategories,
    navLinks: asNavLinks(record.navLinks),
    collectionImages: asImageMap(record.collectionImages, DEFAULT_STOREFRONT_CONTENT.collectionImages),
    collectionImagePosters: asImageMap(
      record.collectionImagePosters,
      DEFAULT_STOREFRONT_CONTENT.collectionImagePosters,
    ),
    collectionTitles: asCollectionTitles(record.collectionTitles),
    collectionSeo: asCollectionSeo(record.collectionSeo),
    bestSellerSkus: skus.length > 0 ? skus : DEFAULT_STOREFRONT_CONTENT.bestSellerSkus,
    bestSellerColors: asHexList(record.bestSellerColors, DEFAULT_STOREFRONT_CONTENT.bestSellerColors),
    heroStageColor: asHex(record.heroStageColor, DEFAULT_STOREFRONT_CONTENT.heroStageColor),
    productCardColors: asHexList(record.productCardColors, DEFAULT_STOREFRONT_CONTENT.productCardColors),
    megaMenus: asMegaMenus(record.megaMenus),
    customTack: asCustomTack(record.customTack),
    disciplinesSection: asDisciplinesSection(record.disciplinesSection),
    riderGallery: asRiderGallery(record.riderGallery),
    matchingLooks: asMatchingLooks(record.matchingLooks),
  };
}

export function themeToCss(theme: StorefrontTheme): string {
  return `:root{--color-brand-bg:${theme.bg};--color-brand-primary:${theme.primary};--color-brand-secondary:${theme.secondary};--color-brand-accent:${theme.accent};--color-brand-mint:${theme.mint};--color-brand-blush:${theme.blush};--color-text-main:${theme.primary};--color-text-sub:color-mix(in srgb,${theme.primary} 70%,transparent);--color-text-muted:color-mix(in srgb,${theme.primary} 40%,transparent);--color-brand-border:color-mix(in srgb,${theme.primary} 10%,transparent);--vd-green:${theme.primary};--vd-green-soft:color-mix(in srgb,${theme.primary} 10%,transparent);--vd-lime:${theme.accent};--vd-lime-deep:#aeb4b8;--vd-sage:${theme.secondary};--vd-sage-deep:color-mix(in srgb,${theme.secondary} 82%,#142221);--vd-cream:${theme.bg};--vd-body:#666666;--vd-buckskin:${theme.secondary};--vd-ribbon:${theme.primary};--vd-ribbon-deep:color-mix(in srgb,${theme.primary} 82%,#000);--vd-ribbon-text:#f4f1eb;--vd-sorrel:${theme.accent};--vd-dapple:${theme.secondary};--vd-footer:#69262B;--home-ink:${theme.primary};--home-accent:${theme.accent};--home-warm:${theme.bg};--home-mint:${theme.mint};--home-blush:${theme.blush};--home-sage:${theme.secondary};--home-lime-deep:#aeb4b8;--home-sage-deep:color-mix(in srgb,${theme.secondary} 82%,#142221);}`;
}

export { formatMoney } from "@/constants/commerce";

export function tileStyle(color: string): CSSProperties {
  return { ["--tile-color"]: color } as CSSProperties;
}

export function visibleNavLinks(content: StorefrontContent): StorefrontNavLink[] {
  return content.navLinks.filter((item) => !item.hidden);
}

export function visibleShopCategories(content: StorefrontContent): StorefrontShopCategory[] {
  return content.shopCategories.filter((item) => !item.hidden);
}

export function resolveNavImages(content: StorefrontContent): Record<string, { src: string; tone: "blush" | "mint" }> {
  const next: Record<string, { src: string; tone: "blush" | "mint" }> = {};
  const olive = DEFAULT_STOREFRONT_THEME.mint.toLowerCase();

  const put = (key: string, src: string, color?: string) => {
    if (!key || !src || next[key]?.src) {
      return;
    }
    const toneColor = (color || DEFAULT_STOREFRONT_THEME.blush).toLowerCase();
    next[key] = {
      src,
      tone: toneColor === olive ? "mint" : "blush",
    };
  };

  for (const link of content.navLinks) {
    const slug = link.path.replace(/^\/collections\//, "").replace(/^\//, "");
    const category = content.shopCategories.find((item) => item.id === slug || item.href === link.path);
    const src = category?.image || content.shopImages[slug] || content.collectionImages[slug] || "";
    const color = category?.color || content.shopCardColors[slug] || DEFAULT_STOREFRONT_THEME.blush;
    put(link.id, src, color);
  }

  for (const category of content.shopCategories) {
    put(category.id, category.image, category.color);
  }

  for (const [slug, src] of Object.entries(content.shopImages)) {
    put(slug, src, content.shopCardColors[slug]);
  }

  for (const [slug, src] of Object.entries(content.collectionImages)) {
    put(slug, src);
  }

  return next;
}
