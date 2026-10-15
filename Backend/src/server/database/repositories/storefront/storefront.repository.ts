import type { CommerceSettings } from "@/constants/commerce";
import type { StorefrontContent, StorefrontTheme } from "@/constants/storefront";
import { query } from "@/server/database/query";

export type StorefrontRow = {
  setting_key: string;
  published: boolean;
  currency: string;
  standard_shipping_fee: string;
  free_shipping_threshold: string;
  free_shipping_enabled: boolean;
  tax_enabled: boolean;
  tax_rate: string;
  tax_label: string;
  theme: unknown;
  content: unknown;
};

export class StorefrontRepository {
  async findDefault(): Promise<StorefrontRow | null> {
    const result = await query<StorefrontRow>(
      `SELECT setting_key, published, currency, standard_shipping_fee, free_shipping_threshold,
              free_shipping_enabled, tax_enabled, tax_rate, tax_label, theme, content
       FROM storefront_setting
       WHERE setting_key = $1
       LIMIT 1`,
      ["default"],
    );
    return result.rows[0] ?? null;
  }

  async upsertDefault(
    settings: CommerceSettings,
    theme: StorefrontTheme,
    content: StorefrontContent,
  ): Promise<void> {
    await query(
      `INSERT INTO storefront_setting (
         setting_key, published, currency, standard_shipping_fee, free_shipping_threshold,
         free_shipping_enabled, tax_enabled, tax_rate, tax_label, theme, content
       ) VALUES ('default', true, $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
       ON CONFLICT (setting_key) DO UPDATE SET
         published = true,
         currency = EXCLUDED.currency,
         standard_shipping_fee = EXCLUDED.standard_shipping_fee,
         free_shipping_threshold = EXCLUDED.free_shipping_threshold,
         free_shipping_enabled = EXCLUDED.free_shipping_enabled,
         tax_enabled = EXCLUDED.tax_enabled,
         tax_rate = EXCLUDED.tax_rate,
         tax_label = EXCLUDED.tax_label,
         theme = EXCLUDED.theme,
         content = EXCLUDED.content`,
      [
        settings.currency,
        settings.standardShippingFee,
        settings.freeShippingThreshold,
        settings.freeShippingEnabled,
        settings.taxEnabled,
        settings.taxRate,
        settings.taxLabel,
        JSON.stringify(theme),
        JSON.stringify(content),
      ],
    );
  }
}

export const storefrontRepository = new StorefrontRepository();
