import {
  type CommerceSettings,
  DEFAULT_COMMERCE_SETTINGS,
  normalizeCurrency,
  resolveCommerceSettings,
} from "@/constants/commerce";
import {
  DEFAULT_CUSTOM_TACK,
  DEFAULT_DISCIPLINES_SECTION,
  DEFAULT_MEGA_MENUS,
  DEFAULT_RIDER_GALLERY,
  DEFAULT_STOREFRONT_CONTENT,
  MEGA_MENU_IDS,
  type MegaMenuId,
  resolveStorefrontContent,
  resolveStorefrontTheme,
  type StorefrontContent,
  type StorefrontTheme,
} from "@/constants/storefront";

export type StorefrontFormImages = {
  heroProductSrc: string;
  heroVideoSrc: string;
  heroVideoMobileSrc: string;
  heroVideoPosterSrc: string;
  brandStoryPrimarySrc: string;
  brandStorySecondarySrc: string;
  brandStoryPortraitSrc: string;
  productHighlightsImage: string;
  productHighlightsFloats: Record<string, string>;
  glowStatsImage: string;
  faqImage: string;
  authLoginSrc: string;
  authRegisterSrc: string;
  authAdminSrc: string;
  categoryImages: string[];
  collectionImages: Record<string, string>;
  collectionImagePosters: Record<string, string>;
  customTackImage: string;
  megaCardImages: Record<MegaMenuId, string[]>;
  riderGalleryImages: string[];
  riderGalleryPosters: string[];
};

export type StorefrontPublishPayload = {
  commerce: CommerceSettings;
  theme: StorefrontTheme;
  content: StorefrontContent;
};

export function storefrontPublishFromForm(formData: FormData, images: StorefrontFormImages): StorefrontPublishPayload {
  const collectionKeys = Object.keys(DEFAULT_STOREFRONT_CONTENT.collectionImages);
  const categoryCount = Math.min(7, Math.max(0, Number(formData.get("categoryCount") ?? 0)));
  const navCount = Math.min(12, Math.max(0, Number(formData.get("navCount") ?? 0)));
  const categoryIndexes = Array.from({ length: categoryCount }, (_, index) => index);
  const faqItems = Array.from({ length: 16 }, (_, index) => {
    if (!formData.has(`faqQuestion_${index}`)) {
      return null;
    }
    return {
      id: String(
        formData.get(`faqId_${index}`) ??
          DEFAULT_STOREFRONT_CONTENT.faqItems[index]?.id ??
          `faq-${index + 1}`,
      ),
      question: String(formData.get(`faqQuestion_${index}`) ?? ""),
      answer: String(formData.get(`faqAnswer_${index}`) ?? ""),
    };
  }).filter(
    (item): item is { id: string; question: string; answer: string } =>
      Boolean(item && item.question.trim() && item.answer.trim()),
  );
  const features = DEFAULT_STOREFRONT_CONTENT.features.map((item, index) => ({
    title: String(formData.get(`featureTitle_${index}`) ?? item.title),
    description: String(formData.get(`featureDescription_${index}`) ?? item.description),
    icon: String(formData.get(`featureIcon_${index}`) ?? item.icon),
  }));
  const collectionTitles = Object.fromEntries(
    collectionKeys.map((key) => [
      key,
      {
        first: String(formData.get(`collectionFirst_${key}`) ?? DEFAULT_STOREFRONT_CONTENT.collectionTitles[key]?.first ?? ""),
        second: String(
          formData.get(`collectionSecond_${key}`) ?? DEFAULT_STOREFRONT_CONTENT.collectionTitles[key]?.second ?? "",
        ),
      },
    ]),
  );
  const collectionSeo = Object.fromEntries(
    collectionKeys.map((key) => [
      key,
      {
        intro: String(
          formData.get(`collectionSeoIntro_${key}`) ?? DEFAULT_STOREFRONT_CONTENT.collectionSeo[key]?.intro ?? "",
        ),
        metaTitle: String(
          formData.get(`collectionSeoTitle_${key}`) ?? DEFAULT_STOREFRONT_CONTENT.collectionSeo[key]?.metaTitle ?? "",
        ),
        metaDescription: String(
          formData.get(`collectionSeoDescription_${key}`) ??
            DEFAULT_STOREFRONT_CONTENT.collectionSeo[key]?.metaDescription ??
            "",
        ),
      },
    ]),
  );
  const matchingLooksCount = Math.min(40, Math.max(0, Number(formData.get("matchingLooksCount") ?? 0)));
  const matchingLooks = Array.from({ length: matchingLooksCount }, (_, index) => {
    const title = String(formData.get(`matchingLookTitle_${index}`) ?? "").trim();
    const slug = String(formData.get(`matchingLookSlug_${index}`) ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!title || !slug) {
      return null;
    }
    const productIds = String(formData.get(`matchingLookProductIds_${index}`) ?? "")
      .split(/[,\s]+/)
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 12);
    const publishedRaw = formData.get(`matchingLookPublished_${index}`);
    return {
      id: String(formData.get(`matchingLookId_${index}`) ?? `look-${index + 1}`),
      title,
      slug,
      description: String(formData.get(`matchingLookDescription_${index}`) ?? "").trim(),
      coverSrc: String(formData.get(`matchingLookCoverSrc_${index}`) ?? "").trim(),
      productIds,
      published: publishedRaw === "on" || publishedRaw === "1" || publishedRaw === "true",
      sortOrder: index,
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const theme = resolveStorefrontTheme({
    bg: formData.get("themeBg"),
    primary: formData.get("themePrimary"),
    secondary: formData.get("themeSecondary"),
    accent: formData.get("themeAccent"),
    mint: formData.get("themeMint"),
    blush: formData.get("themeBlush"),
  });
  const heroHeadline = String(formData.get("heroHeadline") ?? "");
  const shopCategories = categoryIndexes.map((index) => {
    const id = String(formData.get(`categoryId_${index}`) ?? `cat-${index + 1}`);
    const permanent = DEFAULT_STOREFRONT_CONTENT.shopCategories.find((item) => item.id === id);
    return {
      id,
      title: String(formData.get(`categoryTitle_${index}`) ?? ""),
      description: String(formData.get(`categoryDescription_${index}`) ?? ""),
      href: permanent?.href ?? String(formData.get(`categoryHref_${index}`) ?? "/collections/all"),
      image: images.categoryImages[index] ?? "",
      alt: String(formData.get(`categoryTitle_${index}`) ?? "Category"),
      icon: String(formData.get(`categoryIcon_${index}`) ?? "stitch"),
      color: String(formData.get(`categoryColor_${index}`) ?? ""),
      hidden: (() => {
        const raw = formData.get(`categoryHidden_${index}`);
        return raw === "on" || raw === "1" || raw === "true";
      })(),
    };
  });
  const navLinks = Array.from({ length: navCount }, (_, index) => ({
    id: String(formData.get(`navId_${index}`) ?? `nav-${index + 1}`),
    label: String(formData.get(`navLabel_${index}`) ?? ""),
    path: String(formData.get(`navPath_${index}`) ?? "/collections/all"),
    hidden: (() => {
      const raw = formData.get(`navHidden_${index}`);
      return raw === "on" || raw === "1" || raw === "true";
    })(),
  }));

  const megaMenus = Object.fromEntries(
    MEGA_MENU_IDS.map((menuId) => {
      const fallback = DEFAULT_MEGA_MENUS[menuId];
      const cards = fallback.cards.map((card, index) => ({
        id: String(formData.get(`megaCardId_${menuId}_${index}`) ?? card.id),
        label: String(formData.get(`megaCardLabel_${menuId}_${index}`) ?? card.label),
        href: String(formData.get(`megaCardHref_${menuId}_${index}`) ?? card.href),
        image: images.megaCardImages[menuId]?.[index] ?? card.image,
      }));
      return [
        menuId,
        {
          headline: String(formData.get(`megaHeadline_${menuId}`) ?? fallback.headline),
          cards,
        },
      ];
    }),
  ) as StorefrontContent["megaMenus"];

  const customTack = {
    title: String(formData.get("customTackTitle") ?? DEFAULT_CUSTOM_TACK.title),
    titleAccent: String(formData.get("customTackTitleAccent") ?? DEFAULT_CUSTOM_TACK.titleAccent),
    lead: String(formData.get("customTackLead") ?? DEFAULT_CUSTOM_TACK.lead),
    image: images.customTackImage || DEFAULT_CUSTOM_TACK.image,
    ctaLabel: String(formData.get("customTackCtaLabel") ?? DEFAULT_CUSTOM_TACK.ctaLabel),
    ctaHref: String(formData.get("customTackCtaHref") ?? DEFAULT_CUSTOM_TACK.ctaHref),
    options: DEFAULT_CUSTOM_TACK.options.map((option, index) => ({
      id: String(formData.get(`customTackOptionId_${index}`) ?? option.id),
      title: String(formData.get(`customTackOptionTitle_${index}`) ?? option.title),
      description: String(formData.get(`customTackOptionDescription_${index}`) ?? option.description),
      href: String(formData.get(`customTackOptionHref_${index}`) ?? option.href),
    })),
  };

  const disciplinesSection = {
    title: String(formData.get("disciplinesTitle") ?? DEFAULT_DISCIPLINES_SECTION.title),
    titleMark: String(formData.get("disciplinesTitleMark") ?? DEFAULT_DISCIPLINES_SECTION.titleMark),
    support: String(formData.get("disciplinesSupport") ?? DEFAULT_DISCIPLINES_SECTION.support),
    ctaLabel: String(formData.get("disciplinesCtaLabel") ?? DEFAULT_DISCIPLINES_SECTION.ctaLabel),
    ctaHref: String(formData.get("disciplinesCtaHref") ?? DEFAULT_DISCIPLINES_SECTION.ctaHref),
    items: DEFAULT_DISCIPLINES_SECTION.items.map((item, index) => ({
      id: String(formData.get(`disciplineItemId_${index}`) ?? item.id),
      title: String(formData.get(`disciplineItemTitle_${index}`) ?? item.title),
      description: String(formData.get(`disciplineItemDescription_${index}`) ?? item.description),
      href: String(formData.get(`disciplineItemHref_${index}`) ?? item.href),
      cta: String(formData.get(`disciplineItemCta_${index}`) ?? item.cta),
    })),
  };

  const riderGallery = {
    title: String(formData.get("riderGalleryTitle") ?? DEFAULT_RIDER_GALLERY.title),
    titleMark: String(formData.get("riderGalleryTitleMark") ?? DEFAULT_RIDER_GALLERY.titleMark),
    lead: String(formData.get("riderGalleryLead") ?? DEFAULT_RIDER_GALLERY.lead),
    ctaLabel: String(formData.get("riderGalleryCtaLabel") ?? DEFAULT_RIDER_GALLERY.ctaLabel),
    ctaHref: String(formData.get("riderGalleryCtaHref") ?? DEFAULT_RIDER_GALLERY.ctaHref),
    items: DEFAULT_RIDER_GALLERY.items.map((item, index) => ({
      id: String(formData.get(`riderGalleryItemId_${index}`) ?? item.id),
      src: images.riderGalleryImages[index] ?? item.src,
      poster: images.riderGalleryPosters[index] ?? item.poster ?? "",
      alt: String(formData.get(`riderGalleryItemAlt_${index}`) ?? item.alt),
      label: String(formData.get(`riderGalleryItemLabel_${index}`) ?? item.label),
      href: String(formData.get(`riderGalleryItemHref_${index}`) ?? item.href),
      tone: String(formData.get(`riderGalleryItemTone_${index}`) ?? item.tone) as (typeof item)["tone"],
    })),
  };

  return {
    theme,
    commerce: resolveCommerceSettings({
      currency: normalizeCurrency(String(formData.get("currency") ?? DEFAULT_COMMERCE_SETTINGS.currency)),
      standardShippingFee: Number(formData.get("standardShippingFee") ?? 0),
      freeShippingThreshold: Number(formData.get("freeShippingThreshold") ?? 0),
      freeShippingEnabled: formData.get("freeShippingEnabled") === "on",
      taxEnabled: formData.get("taxEnabled") === "on",
      taxRate: Number(formData.get("taxRate") ?? 0),
      taxLabel: String(formData.get("taxLabel") ?? DEFAULT_COMMERCE_SETTINGS.taxLabel).trim() || DEFAULT_COMMERCE_SETTINGS.taxLabel,
    }),
    content: resolveStorefrontContent({
      heroHeadline,
      heroSupport: formData.get("heroSupport"),
      heroProductSrc: images.heroProductSrc,
      heroVideoSrc: images.heroVideoSrc,
      heroVideoMobileSrc: images.heroVideoMobileSrc,
      heroVideoPosterSrc: images.heroVideoPosterSrc,
      heroProductAlt: formData.get("heroProductAlt") || heroHeadline,
      brandStoryPrimarySrc: images.brandStoryPrimarySrc,
      brandStorySecondarySrc: images.brandStorySecondarySrc,
      brandStoryPortraitSrc: images.brandStoryPortraitSrc,
      productHighlightsImage: images.productHighlightsImage,
      productHighlightsFloats: images.productHighlightsFloats,
      glowStatsImage: images.glowStatsImage,
      faqImage: images.faqImage,
      faqImageAlt: formData.get("faqImageAlt") || "Frequently asked questions",
      faqItems,
      features,
      brandStoryLead: formData.get("brandStoryLead"),
      brandStoryMid: formData.get("brandStoryMid"),
      brandStoryEnd: formData.get("brandStoryEnd"),
      footerStatementLead: formData.get("footerStatementLead"),
      footerStatementEnd: formData.get("footerStatementEnd"),
      socialFacebook: formData.get("socialFacebook"),
      socialInstagram: formData.get("socialInstagram"),
      socialPinterest: formData.get("socialPinterest"),
      aboutCopy: formData.get("aboutCopy"),
      contactLead: formData.get("contactLead"),
      supportPhone: formData.get("supportPhone"),
      authLoginSrc: images.authLoginSrc,
      authRegisterSrc: images.authRegisterSrc,
      authAdminSrc: images.authAdminSrc,
      shopCategories,
      navLinks,
      collectionImages: images.collectionImages,
      collectionImagePosters: images.collectionImagePosters,
      collectionTitles,
      collectionSeo,
      matchingLooks,
      bestSellerSkus: [formData.get("bestSellerSku1"), formData.get("bestSellerSku2"), formData.get("bestSellerSku3")],
      bestSellerColors: [formData.get("bestSellerColor1"), formData.get("bestSellerColor2"), formData.get("bestSellerColor3")],
      heroStageColor: formData.get("heroStageColor"),
      productCardColors: [
        formData.get("productCardColor1"),
        formData.get("productCardColor2"),
        formData.get("productCardColor3"),
      ],
      megaMenus,
      customTack,
      disciplinesSection,
      riderGallery,
    }),
  };
}
