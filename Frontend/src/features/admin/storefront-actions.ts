"use server";

import { redirect } from "next/navigation";

import { ADMIN_ROLES, hasPermission } from "@/constants/roles";
import {
  DEFAULT_STOREFRONT_CONTENT,
  MEGA_MENU_IDS,
  type MegaMenuId,
} from "@/constants/storefront";
import { storefrontPublishFromForm } from "@/features/admin/parse-storefront-form";
import { storefrontService } from "@/lib/api/storefront";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { saveUpload } from "@/lib/save-upload";
import { getSessionUser } from "@/lib/session";

async function readImage(formData: FormData, field: string): Promise<string> {
  if (String(formData.get(`${field}Cleared`) ?? "") === "1") {
    return "";
  }
  const uploaded = await saveUpload(formData.get(`${field}File`) as File | null);
  if (uploaded) {
    return uploaded;
  }
  return String(formData.get(field) ?? "").trim();
}

/** Cover URL written by MediaUrlField when the primary field is a video. */
function readPoster(formData: FormData, field: string, mediaSrc: string): string {
  if (!mediaSrc || String(formData.get(`${field}Cleared`) ?? "") === "1") {
    return "";
  }
  if (!/\.(mp4|webm|mov)(\?|$)/i.test(mediaSrc)) {
    return "";
  }
  return String(formData.get(`${field}Poster`) ?? "").trim();
}

async function readImageMap(formData: FormData, prefix: string, keys: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    keys.map(async (key) => {
      const value = await readImage(formData, `${prefix}_${key}`);
      return [key, value] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function readPosterMap(
  formData: FormData,
  prefix: string,
  media: Record<string, string>,
): Promise<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(media).map(([key, src]) => [key, readPoster(formData, `${prefix}_${key}`, src)]),
  );
}

/**
 * Form-state entry point for the storefront editor.
 *
 * `useActionState` must receive this server action directly — wrapping it in a client
 * closure drops progressive enhancement and leaves Publish dead if hydration fails.
 */
export async function publishStorefrontAction(
  _previous: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  return updateCommerceSettingsAction(formData);
}

export async function updateCommerceSettingsAction(formData: FormData): Promise<{ error?: string }> {
  try {
    const user = await getSessionUser();
    if (!user || !ADMIN_ROLES.includes(user.role) || !hasPermission(user.role, "MANAGE_CMS")) {
      redirect("/admin/login");
    }
    const collectionKeys = Object.keys(DEFAULT_STOREFRONT_CONTENT.collectionImages);
    const categoryCount = Math.min(7, Math.max(0, Number(formData.get("categoryCount") ?? 0)));
    const categoryIndexes = Array.from({ length: categoryCount }, (_, index) => index);
    const riderCount = DEFAULT_STOREFRONT_CONTENT.riderGallery.items.length;
    const [
      heroProductSrc,
      heroVideoSrc,
      heroVideoMobileSrc,
      heroVideoPosterSrc,
      brandStoryPrimarySrc,
      brandStorySecondarySrc,
      brandStoryPortraitSrc,
      productHighlightsImage,
      glowStatsImage,
      faqImage,
      authLoginSrc,
      authRegisterSrc,
      authAdminSrc,
      categoryImages,
      collectionImages,
      customTackImage,
      riderGalleryImages,
      ...megaCardImageLists
    ] = await Promise.all([
      readImage(formData, "heroProductSrc"),
      readImage(formData, "heroVideoSrc"),
      readImage(formData, "heroVideoMobileSrc"),
      readImage(formData, "heroVideoPosterSrc"),
      readImage(formData, "brandStoryPrimarySrc"),
      readImage(formData, "brandStorySecondarySrc"),
      readImage(formData, "brandStoryPortraitSrc"),
      readImage(formData, "productHighlightsImage"),
      readImage(formData, "glowStatsImage"),
      readImage(formData, "faqImage"),
      readImage(formData, "authLoginSrc"),
      readImage(formData, "authRegisterSrc"),
      readImage(formData, "authAdminSrc"),
      Promise.all(categoryIndexes.map((index) => readImage(formData, `categoryImage_${index}`))),
      readImageMap(formData, "collectionImage", collectionKeys),
      readImage(formData, "customTackImage"),
      Promise.all(
        Array.from({ length: riderCount }, (_, index) => readImage(formData, `riderGalleryItemSrc_${index}`)),
      ),
      ...MEGA_MENU_IDS.map((menuId) =>
        Promise.all(
          DEFAULT_STOREFRONT_CONTENT.megaMenus[menuId].cards.map((_, index) =>
            readImage(formData, `megaCardImage_${menuId}_${index}`),
          ),
        ),
      ),
    ]);
    const collectionImagePosters = await readPosterMap(formData, "collectionImage", collectionImages);
    const riderGalleryPosters = riderGalleryImages.map((src, index) =>
      readPoster(formData, `riderGalleryItemSrc_${index}`, src),
    );

    const megaCardImages = Object.fromEntries(
      MEGA_MENU_IDS.map((menuId, index) => [menuId, megaCardImageLists[index] ?? []]),
    ) as Record<MegaMenuId, string[]>;

    const published = storefrontPublishFromForm(formData, {
      heroProductSrc,
      heroVideoSrc,
      heroVideoMobileSrc,
      heroVideoPosterSrc,
      brandStoryPrimarySrc,
      brandStorySecondarySrc,
      brandStoryPortraitSrc,
      productHighlightsImage,
      productHighlightsFloats: {
        seeds: "",
        slice: "",
        leaf: "",
        petal: "",
        droplet: "",
      },
      glowStatsImage,
      faqImage,
      authLoginSrc,
      authRegisterSrc,
      authAdminSrc,
      categoryImages,
      collectionImages,
      collectionImagePosters,
      customTackImage,
      megaCardImages,
      riderGalleryImages,
      riderGalleryPosters,
    });
    // Force exact image paths from the form (including intentional clears) so resolve defaults
    // cannot resurrect stock FAQ / homepage art after Remove.
    published.content.heroProductSrc = heroProductSrc;
    // The three hero files are one render: store them together, or clear all three for the default.
    published.content.heroVideoSrc = heroVideoSrc;
    published.content.heroVideoMobileSrc = heroVideoSrc ? heroVideoMobileSrc : "";
    published.content.heroVideoPosterSrc = heroVideoSrc ? heroVideoPosterSrc : "";
    published.content.brandStoryPrimarySrc = brandStoryPrimarySrc;
    published.content.brandStorySecondarySrc = brandStorySecondarySrc;
    published.content.brandStoryPortraitSrc = brandStoryPortraitSrc;
    published.content.productHighlightsImage = productHighlightsImage;
    // Floating side cutouts are disabled for the menswear Why MUSAFIR board.
    published.content.productHighlightsFloats = {
      seeds: "",
      slice: "",
      leaf: "",
      petal: "",
      droplet: "",
    };
    published.content.glowStatsImage = glowStatsImage;
    published.content.faqImage = faqImage;
    published.content.authLoginSrc = authLoginSrc;
    published.content.authRegisterSrc = authRegisterSrc;
    published.content.authAdminSrc = authAdminSrc;
    published.content.collectionImages = {
      ...published.content.collectionImages,
      ...collectionImages,
    };
    published.content.collectionImagePosters = {
      ...published.content.collectionImagePosters,
      ...collectionImagePosters,
    };
    published.content.customTack = {
      ...published.content.customTack,
      image: customTackImage || DEFAULT_STOREFRONT_CONTENT.customTack.image,
    };
    published.content.riderGallery = {
      ...published.content.riderGallery,
      items: published.content.riderGallery.items.map((item, index) => ({
        ...item,
        src:
          riderGalleryImages[index] ||
          item.src ||
          DEFAULT_STOREFRONT_CONTENT.riderGallery.items[index]?.src ||
          "",
        poster: riderGalleryPosters[index] || "",
      })),
    };
    categoryIndexes.forEach((index) => {
      const id = String(formData.get(`categoryId_${index}`) ?? "").trim();
      const category =
        published.content.shopCategories.find((item) => item.id === id) ??
        published.content.shopCategories[index];
      if (!category) {
        return;
      }
      const hiddenRaw = String(formData.get(`categoryHidden_${index}`) ?? "")
        .trim()
        .toLowerCase();
      category.hidden = hiddenRaw === "1" || hiddenRaw === "on" || hiddenRaw === "true";
      const nextImage = String(categoryImages[index] ?? "").trim();
      const cleared = String(formData.get(`categoryImage_${index}Cleared`) ?? "") === "1";
      if (cleared || !nextImage) {
        // Required shop tiles: clear → reset to default asset.
        category.image =
          DEFAULT_STOREFRONT_CONTENT.shopCategories.find((item) => item.id === category.id)?.image ??
          DEFAULT_STOREFRONT_CONTENT.shopCategories[index]?.image ??
          "";
      } else {
        category.image = nextImage;
      }
    });
    // Keep shopImages map in sync with category tiles (homepage + mega lookups).
    published.content.shopImages = Object.fromEntries(
      published.content.shopCategories.map((item) => [item.id, item.image]),
    );
    // Shop mega-menu cards that share a category href inherit the tile image when
    // the mega card itself was not given a new upload this publish.
    const shopByHref = new Map(published.content.shopCategories.map((item) => [item.href, item.image]));
    for (const menuId of MEGA_MENU_IDS) {
      const images = megaCardImages[menuId] ?? [];
      published.content.megaMenus[menuId] = {
        ...published.content.megaMenus[menuId],
        cards: published.content.megaMenus[menuId].cards.map((card, index) => {
          const cleared = String(formData.get(`megaCardImage_${menuId}_${index}Cleared`) ?? "") === "1";
          const explicit = String(images[index] ?? "").trim();
          if (cleared) {
            return {
              ...card,
              image: DEFAULT_STOREFRONT_CONTENT.megaMenus[menuId].cards[index]?.image ?? card.image,
            };
          }
          if (explicit) {
            return { ...card, image: explicit };
          }
          const fromShop = shopByHref.get(card.href);
          if (fromShop) {
            return { ...card, image: fromShop };
          }
          return card;
        }),
      };
    }
    await storefrontService.updatePublished(published.commerce, published.theme, published.content);
    revalidateStorefront();
    redirect("/admin/customer-side");
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) {
      throw error;
    }
    return { error: error instanceof Error ? error.message : "Storefront could not be published" };
  }
}
