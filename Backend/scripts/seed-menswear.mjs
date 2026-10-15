/**
 * Seed / refresh demo best-seller products for the Pakistani menswear storefront.
 * Keeps legacy SKUs so storefront bestSellerSkus links stay valid.
 */
import { randomUUID } from "crypto";
import pg from "pg";

import { databaseUrl } from "./db-url.mjs";

const pool = new pg.Pool({
  connectionString: databaseUrl(),
});

const PRODUCTS = [
  {
    sku: "ZM-SAD-001",
    title: "Navy Windowpane Blazer",
    slug: "navy-windowpane-blazer",
    category: "coats-blazers",
    price: 18500,
    description:
      "Sharp navy blazer with a subtle windowpane check — built for office, shaadi season and smart evenings.",
    image: "/assets/images/musafir-coats-blazers.png",
    alt: "MUSAFIR navy windowpane blazer",
    includes: "M",
    composition: "Wool-blend suiting fabric",
    care: "Dry clean only",
  },
  {
    sku: "ZM-BRI-001",
    title: "Classic White Formal Shirt",
    slug: "classic-white-formal-shirt",
    category: "shirts",
    price: 4500,
    description:
      "Clean formal shirt for workdays and evenings — easy to pair with blazers, trousers and footwear.",
    image: "/assets/images/musafir-shirts.png",
    alt: "MUSAFIR classic white formal shirt",
    includes: "M",
    composition: "Cotton",
    care: "Machine wash cold or dry clean",
  },
  {
    sku: "ZM-SHO-001",
    title: "Charcoal Formal Trousers",
    slug: "charcoal-formal-trousers",
    category: "trousers",
    price: 12000,
    description:
      "Tailored charcoal trousers with a clean drape — the right base for coats, shirts and matching sets.",
    image: "/assets/images/musafir-trousers.png",
    alt: "MUSAFIR charcoal formal trousers",
    includes: "M",
    composition: "Wool-blend",
    care: "Dry clean recommended",
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
           id, title, slug, sku, category, price, original_price, discount, discount_type,
           description_intro, description_detail, description_highlights,
           spec_composition, spec_care, spec_includes, return_policy, sizes, tile_color,
           best_seller, stock, status
         ) values (
           $1,$2,$3,$4,$5,$6,null,0,'percentage',$7,$7,'{}',$8,$9,$10,$11,'{}',null,true,80,'published'
         )`,
        [
          productId,
          item.title,
          item.slug,
          item.sku,
          item.category,
          item.price,
          item.description,
          item.composition,
          item.care,
          item.includes,
          "Unused items may be exchanged within 14 days of delivery across Pakistan.\nShipping and return terms follow the published store policies.\nPayment is cash on delivery unless otherwise shown at checkout.",
        ],
      );
      console.log("created", item.sku, item.title);
    } else {
      await client.query(
        `update product set
           title = $2, slug = $3, category = $4, price = $5,
           description_intro = $6, description_detail = $6,
           spec_composition = $7, spec_care = $8, spec_includes = $9,
           best_seller = true, status = 'published', deleted_at = null
         where id = $1`,
        [
          productId,
          item.title,
          item.slug,
          item.category,
          item.price,
          item.description,
          item.composition,
          item.care,
          item.includes,
        ],
      );
      console.log("updated", item.sku, item.title);
    }

    await client.query("delete from product_image where product_id = $1", [productId]);
    await client.query(
      `insert into product_image (id, product_id, url, alt, sort_order)
       values ($1, $2, $3, $4, 0)`,
      [randomUUID(), productId, item.image, item.alt],
    );
  }

  // Scrub any other leftover equestrian product titles still in the catalog.
  const scrub = await client.query(
    `update product set
       status = 'archived',
       deleted_at = coalesce(deleted_at, now())
     where deleted_at is null
       and (
         title ~* '(horse|hourse|saddle|bridle|halter|horseshoe|tack|forge|concho)'
         or description_intro ~* '(horse|hourse|saddle|bridle|halter|horseshoe|tack|forge|concho)'
         or category in ('saddles','bridles','halters','reins','care','tack')
       )
       and sku not in ('ZM-SAD-001','ZM-BRI-001','ZM-SHO-001')
     returning sku, title`,
  );
  for (const row of scrub.rows) {
    console.log("archived equestrian leftover", row.sku, row.title);
  }

  const sf = await client.query("select content from storefront_setting where setting_key = 'default'");
  const content = sf.rows[0]?.content ?? {};
  content.bestSellerSkus = PRODUCTS.map((item) => item.sku);
  await client.query("update storefront_setting set content = $1::jsonb where setting_key = 'default'", [
    JSON.stringify(content),
  ]);
  console.log("storefront bestSellerSkus =>", content.bestSellerSkus);

  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
