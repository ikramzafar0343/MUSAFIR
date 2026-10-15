/**
 * Public information architecture — MUSAFIR menswear.
 * Product grids stay on /collections/*; hubs use HUB_PAGES where needed.
 */

import { brandName } from "@/constants/brand";

export type NavLinkItem = {
  id: string;
  label: string;
  href: string;
};

export type NavGroup = {
  id: string;
  label: string;
  links: NavLinkItem[];
};

export type MainNavItem = {
  id: string;
  label: string;
  href: string;
  children?: never;
  groups?: never;
} | {
  id: string;
  label: string;
  href: string;
  groups: NavGroup[];
  children?: never;
} | {
  id: string;
  label: string;
  href: string;
  children: NavLinkItem[];
  groups?: never;
};

/** Top-level main navigation for desktop + mobile. */
export const MAIN_NAV: MainNavItem[] = [
  {
    id: "navShop",
    label: "Shop",
    href: "/collections/all",
    groups: [
      {
        id: "shop-browse",
        label: "Browse",
        links: [
          { id: "shop-all-link", label: "Shop All", href: "/collections/all" },
          { id: "shop-new", label: "New Arrivals", href: "/collections/new" },
          { id: "shop-pairs", label: "Matching Sets", href: "/collections/matching-pairs" },
        ],
      },
      {
        id: "shop-apparel",
        label: "Menswear",
        links: [
          { id: "shop-coats", label: "Coats & Blazers", href: "/collections/coats-blazers" },
          { id: "shop-shirts", label: "Formal Shirts", href: "/collections/shirts" },
          { id: "shop-trousers", label: "Trousers", href: "/collections/trousers" },
          { id: "shop-shoes", label: "Footwear", href: "/collections/shoes" },
        ],
      },
    ],
  },
  { id: "navNew", label: "New Arrivals", href: "/collections/new" },
  { id: "navPairs", label: "Matching Sets", href: "/collections/matching-pairs" },
  { id: "navAbout", label: "About", href: "/about-us" },
];

/** Flat top-level links for CMS / footer compatibility. */
export const NAV_ITEMS = MAIN_NAV.map((item) => ({
  id: item.id,
  label: item.label,
  path: item.href,
}));

/** Desktop mega-menu featured cards (image grid under Shop). */
export type MegaFeaturedCard = {
  id: string;
  label: string;
  href: string;
  /** Lookup key into shopCategories / collectionImages. */
  imageKey: string;
};

export type MegaFeaturedSection = {
  navId: string;
  headline: string;
  cards: MegaFeaturedCard[];
};

export const MEGA_FEATURED: Record<string, MegaFeaturedSection> = {
  navShop: {
    navId: "navShop",
    headline: "Menswear for every journey",
    cards: [
      {
        id: "mega-shop-new",
        label: "New Arrivals",
        href: "/collections/new",
        imageKey: "new",
      },
      {
        id: "mega-shop-coats",
        label: "Coats & Blazers",
        href: "/collections/coats-blazers",
        imageKey: "coats-blazers",
      },
      {
        id: "mega-shop-shirts",
        label: "Formal Shirts",
        href: "/collections/shirts",
        imageKey: "shirts",
      },
      {
        id: "mega-shop-trousers",
        label: "Trousers",
        href: "/collections/trousers",
        imageKey: "trousers",
      },
      {
        id: "mega-shop-shoes",
        label: "Footwear",
        href: "/collections/shoes",
        imageKey: "shoes",
      },
      {
        id: "mega-shop-pairs",
        label: "Matching Sets",
        href: "/collections/matching-pairs",
        imageKey: "matching-pairs",
      },
    ],
  },
};

export type HubCta = { label: string; href: string };

export type HubPageContent = {
  eyebrow: string;
  title: string;
  lead: string;
  body: string[];
  links: HubCta[];
  primaryCta?: HubCta;
};

export const HUB_PAGES: Record<string, HubPageContent> = {
  craftsmanship: {
    eyebrow: "The MUSAFIR Approach",
    title: "Style That Works Beyond One Occasion.",
    lead: "Clean silhouettes, considered details and versatile combinations you can make your own.",
    body: [
      `At ${brandName}, getting dressed well should feel straightforward. Explore coats, blazers, formal shirts, trousers and footwear chosen to work together for how men dress in Pakistan.`,
    ],
    links: [
      { label: `About ${brandName}`, href: "/about-us" },
      { label: "Shop the collection", href: "/collections/all" },
      { label: "Matching Sets", href: "/collections/matching-pairs" },
    ],
    primaryCta: { label: "Explore the Collection", href: "/collections/all" },
  },
  "size-guide": {
    eyebrow: "Fit",
    title: "Find your fit",
    lead: "Check size and fit information on each product page before ordering.",
    body: [
      "When a size chart is available on a product page, compare it with your measurements. Contact us if you need help choosing a size.",
    ],
    links: [
      { label: "FAQs", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Shop All", href: "/collections/all" },
    ],
    primaryCta: { label: "Contact for Fit Help", href: "/contact" },
  },
};

export function getHubPage(slug: string): HubPageContent | null {
  return HUB_PAGES[slug] ?? null;
}
