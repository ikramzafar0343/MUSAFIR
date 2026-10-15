import type { MetadataRoute } from "next";

import { productService } from "@/lib/api/products";

const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

const paths = [
  "/",
  "/best-sellers",
  "/collections/all",
  "/collections/new",
  "/collections/coats-blazers",
  "/collections/shirts",
  "/collections/trousers",
  "/collections/shoes",
  "/collections/matching-pairs",
  "/faq",
  "/size-guide",
  "/craftsmanship",
  "/about-us",
  "/contact",
  "/privacy",
  "/terms",
  "/shipping",
  "/returns",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${appUrl}${path}`,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const catalog = await productService.list({ limit: 100, status: "published" });
    productEntries = catalog.products.map((product) => ({
      url: `${appUrl}/product/${product.id}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // Sitemap must still render static routes if the API is briefly unavailable.
  }

  return [...staticEntries, ...productEntries];
}
