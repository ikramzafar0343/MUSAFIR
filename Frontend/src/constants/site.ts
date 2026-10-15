import { brandName } from "@/constants/brand";
import { MENSWEAR } from "@/constants/menswear-assets";
import { NAV_ITEMS as MAIN_NAV_FLAT } from "@/constants/navigation-ia";

export type { HubPageContent, MainNavItem, NavGroup, NavLinkItem } from "@/constants/navigation-ia";
export { getHubPage, HUB_PAGES, MAIN_NAV, NAV_ITEMS } from "@/constants/navigation-ia";

/** @deprecated Prefer MAIN_NAV; alias of NAV_ITEMS from navigation-ia. */
export const NAV_ITEMS_FLAT = MAIN_NAV_FLAT;

export const LOCALES = ["en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORT_EMAIL = "sales@musafir.com";

export type SupportContact = {
  readonly id: "pk";
  readonly label: string;
  readonly e164: string;
  readonly digits: string;
  readonly display: string;
};

export const SUPPORT_CONTACTS: readonly SupportContact[] = [
  {
    id: "pk",
    label: "Pakistan",
    e164: "+923214433514",
    digits: "923214433514",
    display: "+92 321 4433514",
  },
];

/** Display form for customers (Pakistan line) */
export const SUPPORT_PHONE = SUPPORT_CONTACTS[0]!.display;
/** Local Pakistan mobile (no spaces) */
export const SUPPORT_PHONE_LOCAL = "03214433514";
/** E.164 for tel: links and WhatsApp */
export const SUPPORT_PHONE_E164 = SUPPORT_CONTACTS[0]!.e164;
export const SUPPORT_PHONE_DIGITS = SUPPORT_CONTACTS[0]!.digits;
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE_DIGITS}`;
export const SUPPORT_ADDRESS = "12 Gulberg III, Lahore, Pakistan 54000";

export function formatSupportContactsLine(): string {
  return SUPPORT_CONTACTS.map((item) => `${item.display} (${item.label})`).join(" / ");
}

export function supportWhatsAppUrl(prefill?: string): string {
  if (!prefill?.trim()) {
    return SUPPORT_WHATSAPP_URL;
  }
  return `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(prefill.trim())}`;
}

/** Normalize PK / international phones to WhatsApp digits (country code, no +). */
export function toWhatsAppDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }
  if (digits.startsWith("92") && digits.length >= 12) {
    return digits.slice(0, 12);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("3")) {
    return `92${digits}`;
  }
  return digits;
}

export function resolveSupportPhoneDigits(phone?: string | null): string {
  return toWhatsAppDigits(phone ?? "") ?? SUPPORT_PHONE_DIGITS;
}

export function formatSupportPhoneDisplay(phone?: string | null): string {
  const digits = resolveSupportPhoneDigits(phone);
  const known = SUPPORT_CONTACTS.find((item) => item.digits === digits);
  if (known) {
    return known.display;
  }
  if (digits.startsWith("92") && digits.length === 12) {
    const local = `0${digits.slice(2)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  if (digits.startsWith("1") && digits.length === 11) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  const trimmed = String(phone ?? "").trim();
  return trimmed || SUPPORT_PHONE;
}

export function supportPhoneE164(phone?: string | null): string {
  return `+${resolveSupportPhoneDigits(phone)}`;
}

export function supportWhatsAppUrlFromPhone(phone?: string | null, prefill?: string): string {
  const base = `https://wa.me/${resolveSupportPhoneDigits(phone)}`;
  if (!prefill?.trim()) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(prefill.trim())}`;
}

export const SHOP_RANGE_EYEBROW = "EXPLORE MUSAFIR";
export const SHOP_RANGE_TITLE = "Find Your Fit. Define Your Look.";
export const SHOP_RANGE_SUPPORT =
  "Office-ready essentials and occasion pieces for how men dress across Pakistan.";
export const SHOP_RANGE_SIGNATURE = "Contemporary Pakistani menswear. Considered from head to toe.";

export const SHOP_RANGE_CATEGORIES = [
  {
    id: "coats-blazers",
    title: "Coats & Blazers",
    description: "Sharp layers for office, shaadi season and smart occasions.",
    href: "/collections/coats-blazers",
    image: MENSWEAR.coatsBlazers,
    alt: `${brandName} coats and blazers`,
    tone: "blush",
    icon: "stitch",
    cta: "Shop Coats & Blazers",
  },
  {
    id: "shirts",
    title: "Formal Shirts",
    description: "Clean styles for workdays, meetings and evening plans.",
    href: "/collections/shirts",
    image: MENSWEAR.shirts,
    alt: `${brandName} formal shirts`,
    tone: "mint",
    icon: "leather",
    cta: "Shop Formal Shirts",
  },
  {
    id: "trousers",
    title: "Trousers",
    description: "The right cut for a balanced, polished outfit.",
    href: "/collections/trousers",
    image: MENSWEAR.trousers,
    alt: `${brandName} trousers`,
    tone: "blush",
    icon: "balance",
    cta: "Shop Trousers",
  },
  {
    id: "shoes",
    title: "Footwear",
    description: "Formal and smart shoes to finish every look.",
    href: "/collections/shoes",
    image: MENSWEAR.shoes,
    alt: `${brandName} footwear`,
    tone: "mint",
    icon: "shield",
    cta: "Shop Footwear",
  },
  {
    id: "matching-pairs",
    title: "Matching Sets",
    description: "Ready combinations of clothing and footwear that work together.",
    href: "/collections/matching-pairs",
    image: MENSWEAR.matchingPairs,
    alt: `${brandName} matching sets`,
    tone: "blush",
    icon: "stitch",
    cta: "Explore Matching Sets",
  },
] as const;

export const SHOP_RANGE_TRUST = [
  { id: "natural", title: "Made for Pakistan", detail: "Looks that fit office, events and everyday wear.", icon: "leather" },
  { id: "cruelty", title: "Matching Sets", detail: "Coordinated pieces, curated together.", icon: "stitch" },
  { id: "tested", title: "Cash on Delivery", detail: "Pay when your order arrives.", icon: "shield" },
  { id: "sustain", title: "Clear Product Details", detail: "Fabric, fit and care on every product page.", icon: "balance" },
] as const;

export const BEST_SELLERS_CTA = "View Best Sellers";
export const BEST_SELLERS_CTA_HREF = "/best-sellers";
export const BEST_SELLERS_VIEW = "View Product";

export type BestSellerSlot = {
  id: string;
  title: string;
  description: string;
  price: number;
  href: string;
  image: string;
  alt: string;
  tone: string;
  sku: string;
  category: string;
  keywords: string[];
};

/** Empty — do not invent SKUs; homepage uses live best-seller flags / admin SKUs. */
export const BEST_SELLERS: readonly BestSellerSlot[] = [];

export const PRODUCT_HIGHLIGHTS_TITLE = `${brandName} Product`;
export const PRODUCT_HIGHLIGHTS_MARK = "Highlights";
export const PRODUCT_HIGHLIGHTS_IMAGE = MENSWEAR.highlights;
export const PRODUCT_HIGHLIGHTS_ALT = `${brandName} menswear highlight`;

export const PRODUCT_HIGHLIGHTS = [
  {
    id: "hydrating",
    corner: "tl",
    title: "Made for Everyday Pakistan",
    description: "Contemporary cuts for the office, family events, evenings out and everything in between.",
    icon: "leather",
  },
  {
    id: "cruelty",
    corner: "tr",
    title: "Matching Sets, Sorted",
    description: "Find complementary pieces together instead of starting from scratch.",
    icon: "stitch",
  },
  {
    id: "aging",
    corner: "bl",
    title: "Balanced Looks",
    description: "Coats, formal shirts, trousers and footwear chosen to work together with ease.",
    icon: "balance",
  },
  {
    id: "soothing",
    corner: "br",
    title: "Details Worth Noticing",
    description: "Clear fabric, fit and care information so you can order with confidence.",
    icon: "shield",
  },
] as const;

export const GLOW_STATS_TITLE = "Pakistani Menswear. Made to Work Together.";
export const GLOW_STATS_COPY =
  "Clean silhouettes, considered details and matching sets you can make your own.";
export const GLOW_STATS_CTA = "Shop the Collection";
export const GLOW_STATS_CTA_HREF = "/collections/all";
export const GLOW_STATS_IMAGE = MENSWEAR.glow;
export const GLOW_STATS_ALT = `${brandName} menswear collection`;

export const HOME_TESTIMONIALS_BADGE = "Customer reviews";
export const HOME_TESTIMONIALS_HEADLINE = "What customers say";
export const HOME_TESTIMONIALS_RIBBON = "Every Journey, Well Dressed.";
export const HOME_TESTIMONIALS_RATING = 0;
export const HOME_TESTIMONIALS_COUNT = 0;

export type HomeTestimonial = {
  id: string;
  name: string;
  when: string;
  rating: number;
  initials: string;
  tone: string;
  body: string;
};

/** Empty until verified review records exist — do not invent testimonials. */
export const HOME_TESTIMONIALS: readonly HomeTestimonial[] = [];

export const FEATURES = [
  {
    title: "Made for Everyday Pakistan",
    description: "Contemporary menswear for the office, family events, evenings out and everything in between.",
    icon: "stitch",
  },
  {
    title: "Matching Sets, Sorted",
    description: "Coordinated coats, shirts, trousers and footwear so putting a look together feels easier.",
    icon: "leather",
  },
  {
    title: "Shop with Confidence",
    description: "Clear fabric and fit details, cash on delivery, and delivery across Pakistan.",
    icon: "shield",
  },
] as const;

export const HOME_FAQ_TITLE_BEFORE = "Your";
export const HOME_FAQ_TITLE_AFTER = "Questions, Answered";
export const HOME_FAQ_IMAGE = MENSWEAR.faq;
export const HOME_FAQ_IMAGE_ALT = `${brandName} collection`;

export const HOME_FAQ = [
  {
    id: "what-sells",
    question: "What does MUSAFIR sell?",
    answer:
      "MUSAFIR offers men's coats and blazers, formal shirts, trousers, footwear and curated matching sets for the Pakistani market. Browse each category to see the current collection.",
  },
  {
    id: "matching-pairs",
    question: "What are Matching Sets?",
    answer:
      "Matching Sets are curated combinations of clothing and footwear designed to help you put together a coordinated look. Available items, colours and sizes are shown on their product pages.",
  },
  {
    id: "buy-separately",
    question: "Can I buy pieces separately?",
    answer:
      "You can explore the individual products within a Matching Set and purchase those offered separately. Where a set is sold as one product, its page will show how it is purchased.",
  },
  {
    id: "size",
    question: "How do I choose the right size?",
    answer:
      "Check the size and fit information shown on each product page. If a size chart is available, compare it with your measurements before ordering. WhatsApp us if you need help choosing a size.",
  },
  {
    id: "availability",
    question: "How can I check product availability?",
    answer:
      "Available sizes and stock status are displayed on each product page and may change as items sell.",
  },
  {
    id: "delivery",
    question: "Do you deliver across Pakistan?",
    answer:
      "Yes. We deliver across Pakistan. Delivery charges and any free-delivery threshold are shown at checkout. Typical delivery is a few working days depending on your city.",
  },
  {
    id: "payment",
    question: "How do I pay?",
    answer:
      "Payment is cash on delivery. Please keep the order total ready when your parcel arrives.",
  },
  {
    id: "care",
    question: "Where can I find care instructions?",
    answer:
      "Look for fabric and care information on the individual product page. Follow the care label attached to the garment when applicable.",
  },
  {
    id: "contact",
    question: `How can I contact ${brandName}?`,
    answer:
      "Reach us through the Contact page or WhatsApp for questions about orders or products. Guest orders can also be looked up at Order Lookup with your email and order number.",
  },
  {
    id: "tracking",
    question: "How do I track my order?",
    answer:
      "After checkout, look up a guest order at Order Lookup with your email and order number. Signed-in members can also follow status under Account, Orders.",
  },
] as const;

export const FOOTER_SOCIAL = [
  { id: "facebook", label: "Facebook", href: "https://facebook.com/musafir", icon: "facebook" },
  { id: "instagram", label: "Instagram", href: "https://instagram.com/musafir", icon: "instagram" },
  { id: "pinterest", label: "Pinterest", href: "https://pinterest.com/musafir", icon: "pinterest" },
] as const;

export const FOOTER_NAV = [
  {
    id: "shop",
    title: "Shop",
    links: [
      { label: "Shop All", href: "/collections/all" },
      { label: "Coats & Blazers", href: "/collections/coats-blazers" },
      { label: "Formal Shirts", href: "/collections/shirts" },
      { label: "Trousers", href: "/collections/trousers" },
      { label: "Footwear", href: "/collections/shoes" },
      { label: "Matching Sets", href: "/collections/matching-pairs" },
    ],
  },
  {
    id: "help",
    title: "Help",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "FAQs", href: "/faq" },
      { label: "Track order", href: "/orders/lookup" },
    ],
  },
  {
    id: "about",
    title: "About",
    links: [
      { label: "Our Story", href: "/about-us" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
] as const;

export const COLLECTION_HEROES: Record<
  string,
  {
    first: string;
    second: string;
    image: string;
    alt: string;
    tone: "mint" | "blush" | "olive";
    intro: string;
    metaTitle: string;
    metaDescription: string;
  }
> = {
  all: {
    first: "The",
    second: "Collection",
    image: MENSWEAR.collection,
    alt: `${brandName} collection`,
    tone: "mint",
    intro:
      "Discover coats, blazers, formal shirts, trousers and footwear for office, events and everyday — sharp alone, better together.",
    metaTitle: `Shop Men's Clothing in Pakistan | ${brandName}`,
    metaDescription: `Shop contemporary Pakistani menswear at ${brandName}. Explore coats, blazers, formal shirts, trousers, footwear and matching sets.`,
  },
  new: {
    first: "New",
    second: "Arrivals",
    image: MENSWEAR.newArrivals,
    alt: `${brandName} new arrivals`,
    tone: "olive",
    intro: "Explore the latest additions to the collection, from refined layers to the details that complete your look.",
    metaTitle: `New Arrivals | ${brandName}`,
    metaDescription: `Shop new arrivals at ${brandName}. Fresh menswear for office, events and everyday wear in Pakistan.`,
  },
  "coats-blazers": {
    first: "Coats &",
    second: "Blazers",
    image: MENSWEAR.coatsBlazers,
    alt: `${brandName} coats and blazers`,
    tone: "olive",
    intro:
      "Discover refined layers for office, shaadi season and smart occasions. Explore MUSAFIR coats and blazers designed to pair with formal shirts and trousers.",
    metaTitle: `Men's Coats & Blazers in Pakistan | ${brandName}`,
    metaDescription:
      "Shop MUSAFIR men's coats and blazers in Pakistan. Modern cuts and colours designed to pair with formal shirts and trousers.",
  },
  shirts: {
    first: "Formal",
    second: "Shirts",
    image: MENSWEAR.shirts,
    alt: `${brandName} formal shirts`,
    tone: "mint",
    intro:
      "Find the shirt that brings your look together. Explore clean formal styles for workdays, meetings and evenings — easy to wear with blazers, trousers and footwear.",
    metaTitle: `Men's Formal Shirts in Pakistan | ${brandName}`,
    metaDescription:
      "Shop men's formal shirts from MUSAFIR in Pakistan. Versatile styles to wear on their own or pair with blazers and trousers.",
  },
  trousers: {
    first: "Men's",
    second: "Trousers",
    image: MENSWEAR.trousers,
    alt: `${brandName} trousers`,
    tone: "olive",
    intro:
      "Build your outfit on the right foundation. Discover MUSAFIR trousers designed for a balanced look, from office wear to smarter occasions.",
    metaTitle: `Men's Trousers in Pakistan | ${brandName}`,
    metaDescription:
      "Shop men's trousers at MUSAFIR in Pakistan. Browse versatile fits and colours, and discover matching shirts, coats and footwear.",
  },
  shoes: {
    first: "Men's",
    second: "Footwear",
    image: MENSWEAR.shoes,
    alt: `${brandName} footwear`,
    tone: "mint",
    intro:
      "Finish every outfit with confidence. Explore MUSAFIR footwear — formal and smart shoes that work with your personal style.",
    metaTitle: `Men's Footwear in Pakistan | ${brandName}`,
    metaDescription:
      "Discover men's footwear at MUSAFIR in Pakistan. Formal and smart shoes to complement shirts, trousers, coats and matching sets.",
  },
  "matching-pairs": {
    first: "Matching",
    second: "Sets",
    image: MENSWEAR.matchingPairs,
    alt: `${brandName} matching sets`,
    tone: "olive",
    intro:
      "Great style is easier when the pieces work together. Browse curated combinations of MUSAFIR coats, formal shirts, trousers and footwear, then make each look your own.",
    metaTitle: `Men's Matching Sets & Outfits | ${brandName}`,
    metaDescription:
      "Discover curated men's matching sets at MUSAFIR in Pakistan. Shop complementary coats, shirts, trousers and footwear for complete looks.",
  },
};

export const RITUAL_FEATURE_TITLE = "Style Made For";
export const RITUAL_FEATURE_MARK = "You";

export type RitualIcon =
  | "leather"
  | "horse"
  | "saddle"
  | "stitch"
  | "bridle"
  | "halter"
  | "horseshoe"
  | "balance"
  | "shield";

export const RITUAL_FEATURE_NOTES = [
  {
    id: "pure",
    title: "Made for Pakistan",
    description: "Contemporary pieces for office, events and everyday wear.",
    icon: "leather",
  },
  {
    id: "simple",
    title: "Matching Sets",
    description: "Find complementary items together instead of starting from scratch.",
    icon: "stitch",
  },
] as const;

export const COLLECTION_RITUALS: Record<
  string,
  {
    title: string;
    mark: string;
    notes: readonly [{ title: string; description: string; icon: RitualIcon }, { title: string; description: string; icon: RitualIcon }];
  }
> = {
  all: {
    title: RITUAL_FEATURE_TITLE,
    mark: RITUAL_FEATURE_MARK,
    notes: RITUAL_FEATURE_NOTES,
  },
  new: {
    title: "Fresh Finds For",
    mark: "Now",
    notes: [
      { title: "New Additions", description: "The latest pieces to refresh your wardrobe.", icon: "stitch" },
      { title: "Familiar Confidence", description: "Modern silhouettes that work from day to night.", icon: "leather" },
    ],
  },
  "coats-blazers": {
    title: "Layers Made For",
    mark: "Presence",
    notes: [
      { title: "Sharp Structure", description: "Coats and blazers that bring the whole look together.", icon: "stitch" },
      { title: "Easy Pairing", description: "Designed to work with shirts, trousers and shoes.", icon: "leather" },
    ],
  },
  shirts: {
    title: "Shirts Made For",
    mark: "Everyday",
    notes: [
      { title: "Clean Lines", description: "Formal styles for workdays, meetings and evenings.", icon: "leather" },
      { title: "Easy to Style", description: "Pair with blazers, trousers and footwear.", icon: "stitch" },
    ],
  },
  trousers: {
    title: "Trousers Made For",
    mark: "Balance",
    notes: [
      { title: "Solid Foundation", description: "The right base for a well-balanced outfit.", icon: "balance" },
      { title: "Office to Occasion", description: "Fits that move from everyday wear to smarter dressing.", icon: "leather" },
    ],
  },
  shoes: {
    title: "Footwear Made For",
    mark: "Finish",
    notes: [
      { title: "Finishing Touch", description: "Shoes that complete coats, shirts and trousers.", icon: "shield" },
      { title: "Personal Style", description: "Find a pair that works with how you dress.", icon: "leather" },
    ],
  },
  "matching-pairs": {
    title: "Looks Made For",
    mark: "Together",
    notes: [
      { title: "Better Together", description: "Curated matching sets without the guesswork.", icon: "shield" },
      { title: "Still Your Choice", description: "Pick each piece and size that suits you.", icon: "stitch" },
    ],
  },
};

export const AUTH_BANNERS = {
  login: { src: MENSWEAR.authLogin, alt: `${brandName} collection` },
  register: { src: MENSWEAR.authRegister, alt: `${brandName} collection` },
  adminLogin: { src: MENSWEAR.highlights, alt: `${brandName} collection` },
} as const;

export const INFO_STILLS = {
  about: { src: MENSWEAR.about, alt: `${brandName} collection` },
  contact: { src: MENSWEAR.contact, alt: `${brandName} collection` },
} as const;
