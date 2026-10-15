import type { CommerceSettings } from "@/constants/commerce";
import type { StorefrontContent, StorefrontTheme } from "@/constants/storefront";
import { apiRequest } from "@/lib/api/client";

export type StorefrontState = {
  commerce: CommerceSettings;
  theme: StorefrontTheme;
  content: StorefrontContent;
};

export const storefrontService = {
  getFull: async () => apiRequest<StorefrontState>("GET", "/storefront"),
  updatePublished: async (commerce: CommerceSettings, theme: StorefrontTheme, content: StorefrontContent) =>
    apiRequest<StorefrontState>("PUT", "/admin/storefront", { commerce, theme, content }),
};
