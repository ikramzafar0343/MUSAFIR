import { type CommerceSettings, DEFAULT_COMMERCE_SETTINGS, resolveCommerceSettings } from "@/constants/commerce";
import {
  DEFAULT_STOREFRONT_CONTENT,
  DEFAULT_STOREFRONT_THEME,
  resolveStorefrontTheme,
  type StorefrontContent,
  type StorefrontTheme,
} from "@/constants/storefront";
import { storefrontRepository } from "@/server/database/repositories/storefront/storefront.repository";

export type StorefrontState = {
  commerce: CommerceSettings;
  theme: StorefrontTheme;
  content: StorefrontContent;
};

const FALLBACK_STOREFRONT: StorefrontState = {
  commerce: DEFAULT_COMMERCE_SETTINGS,
  theme: DEFAULT_STOREFRONT_THEME,
  content: DEFAULT_STOREFRONT_CONTENT,
};

export class StorefrontService {
  async getFull(): Promise<StorefrontState> {
    try {
      const row = await storefrontRepository.findDefault();
      if (!row) {
        return FALLBACK_STOREFRONT;
      }
      // Return DB content as stored. Frontend getStorefront runs resolveStorefrontContent.
      return {
        commerce: resolveCommerceSettings({
          currency: row.currency,
          standardShippingFee: Number(row.standard_shipping_fee),
          freeShippingThreshold: Number(row.free_shipping_threshold),
          freeShippingEnabled: row.free_shipping_enabled,
          taxEnabled: row.tax_enabled,
          taxRate: Number(row.tax_rate),
          taxLabel: row.tax_label,
        }),
        theme: resolveStorefrontTheme(row.theme),
        content: (row.content ?? DEFAULT_STOREFRONT_CONTENT) as StorefrontContent,
      };
    } catch {
      return FALLBACK_STOREFRONT;
    }
  }

  async getPublished(): Promise<CommerceSettings> {
    const full = await this.getFull();
    return full.commerce;
  }

  async updatePublished(
    settings: CommerceSettings,
    theme: StorefrontTheme,
    content: StorefrontContent,
  ): Promise<void> {
    await storefrontRepository.upsertDefault(settings, theme, content);
  }
}

export const storefrontService = new StorefrontService();
