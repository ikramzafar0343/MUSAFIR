/**
 * Seed 5 coat / blazer products across shop categories as best sellers.
 * Updates storefront bestSellerSkus to match.
 *
 * Run: npm run db:seed:catalog
 * On VPS: docker compose exec backend node scripts/seed-menswear.mjs
 *   (or from host with DATABASE_URL pointing at the musafir postgres)
 */
import { randomUUID } from "crypto";
import pg from "pg";

import { databaseUrl } from "./db-url.mjs";

const pool = new pg.Pool({
  connectionString: databaseUrl(),
});

const RETURN_POLICY =
  "Unused items may be exchanged within 14 days of delivery across Pakistan.\nShipping and return terms follow the published store policies.\nPayment is cash on delivery unless otherwise shown at checkout.";

/** Five coats — each primary shelf differs; all also tagged coats-blazers where useful. */
const PRODUCTS = [
  {
    sku: "MSF-COAT-001",
    title: "Navy Windowpane Blazer",
    slug: "navy-windowpane-blazer",
    category: "coats-blazers",
    categories: ["coats-blazers", "new-arrivals"],
    price: 18500,
    originalPrice: 22000,
    description:
      "Sharp navy blazer with a subtle windowpane check — built for office, shaadi season and smart evenings.",
    image: "/assets/images/musafir-coats-blazers.png",
    alt: "MUSAFIR navy windowpane blazer",
    includes: "M, L, XL",
    composition: "Wool-blend suiting fabric",
    care: "Dry clean only",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    sku: "MSF-COAT-002",
    title: "Charcoal Structure Coat",
    slug: "charcoal-structure-coat",
    category: "new-arrivals",
    categories: ["new-arrivals", "coats-blazers"],
    price: 24900,
    originalPrice: 28900,
    description:
      "Structured charcoal coat with clean lines — a new-season layer for commute and evening plans.",
    image: "/assets/images/musafir-new-arrivals.png",
    alt: "MUSAFIR charcoal structure coat",
    includes: "M, L",
    composition: "Wool-blend",
    care: "Dry clean only",
    sizes: ["M", "L", "XL"],
  },
  {
    sku: "MSF-COAT-003",
    title: "Midnight Peak Lapel Blazer",
    slug: "midnight-peak-lapel-blazer",
    category: "matching-pairs",
    categories: ["matching-pairs", "coats-blazers"],
    price: 21500,
    originalPrice: null,
    description:
      "Midnight peak-lapel blazer that anchors matching looks with shirts and trousers.",
    image: "/assets/images/musafir-matching-pairs.png",
    alt: "MUSAFIR midnight peak lapel blazer",
    includes: "M, L, XL",
    composition: "Wool-blend suiting fabric",
    care: "Dry clean only",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    sku: "MSF-COAT-004",
    title: "Slate Soft-Shoulder Coat",
    slug: "slate-soft-shoulder-coat",
    category: "coats-blazers",
    categories: ["coats-blazers"],
    price: 26900,
    originalPrice: 29900,
    description:
      "Soft-shoulder slate coat for everyday polish — easy over formal shirts and trousers.",
    image: "/assets/images/musafir-collection.png",
    alt: "MUSAFIR slate soft-shoulder coat",
    includes: "L, XL",
    composition: "Wool-blend with soft shoulder construction",
    care: "Dry clean recommended",
    sizes: ["M", "L", "XL", "XXL"],
  },
  {
    sku: "MSF-COAT-005",
    title: "Ink Check Everyday Blazer",
    slug: "ink-check-everyday-blazer",
    category: "new-arrivals",
    categories: ["new-arrivals", "coats-blazers", "matching-pairs"],
    price: 17500,
    originalPrice: 19900,
    description:
      "Ink check everyday blazer — versatile enough for office, dinner and travel days.",
    image: "/assets/images/musafir-hero.png",
    alt: "MUSAFIR ink check everyday blazer",
    includes: "S, M, L",
    composition: "Wool-blend",
    care: "Dry clean only",
    sizes: ["S", "M", "L", "XL"],
  },
];

const client = await pool.connect();
try {
  await client.query("begin");

  for (const item of PRODUCTS) {
    const existing = await client.query("select id from product where sku = $1 limit 1", [item.sku]);
    let productId = existing.rows[0]?.id;
    if (!productId) {
      productId = randomUUID();
      await client.query(
        `insert into product (
           id, title, slug, sku, category, categories, price, original_price, discount, discount_type,
           description_intro, description_detail, description_highlights,
           spec_composition, spec_care, spec_includes, return_policy, sizes, tile_color,
           best_seller, stock, status
         ) values (
           $1,$2,$3,$4,$5,$6,$7,$8,0,'percentage',$9,$9,'{}',$10,$11,$12,$13,$14,null,true,80,'published'
         )`,
        [
          productId,
          item.title,
          item.slug,
          item.sku,
          item.category,
          item.categories,
          item.price,
          item.originalPrice,
          item.description,
          item.composition,
          item.care,
          item.includes,
          RETURN_POLICY,
          item.sizes,
        ],
      );
      console.log("created", item.sku, item.title, "→", item.category);
    } else {
      await client.query(
        `update product set
           title = $2, slug = $3, category = $4, categories = $5, price = $6, original_price = $7,
           description_intro = $8, description_detail = $8,
           spec_composition = $9, spec_care = $10, spec_includes = $11,
           sizes = $12, best_seller = true, stock = 80, status = 'published', deleted_at = null
         where id = $1`,
        [
          productId,
          item.title,
          item.slug,
          item.category,
          item.categories,
          item.price,
          item.originalPrice,
          item.description,
          item.composition,
          item.care,
          item.includes,
          item.sizes,
        ],
      );
      console.log("updated", item.sku, item.title, "→", item.category);
    }

    await client.query("delete from product_image where product_id = $1", [productId]);
    await client.query(
      `insert into product_image (id, product_id, url, alt, sort_order)
       values ($1, $2, $3, $4, 0)`,
      [randomUUID(), productId, item.image, item.alt],
    );
  }

  // Ensure older demo coats from earlier seeds are also best sellers if still live.
  await client.query(
    `update product set best_seller = true, status = 'published', deleted_at = null
     where sku in ('ZM-SAD-001') and deleted_at is null`,
  );

  const sf = await client.query("select content from storefront_setting where setting_key = 'default'");
  const content = sf.rows[0]?.content ?? {};
  content.bestSellerSkus = PRODUCTS.map((item) => item.sku);
  await client.query("update storefront_setting set content = $1::jsonb where setting_key = 'default'", [
    JSON.stringify(content),
  ]);
  console.log("storefront bestSellerSkus =>", content.bestSellerSkus);

  await client.query("commit");
  console.log("done — 5 coat best sellers seeded");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
