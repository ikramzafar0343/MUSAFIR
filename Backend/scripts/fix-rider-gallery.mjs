import pg from "pg";
import { databaseUrl } from "./db-url.mjs";

const gallery = {
  title: "The MUSAFIR",
  titleMark: "look",
  lead: "Contemporary menswear for office, events and evenings — explore the pieces that define the MUSAFIR look.",
  ctaLabel: "Shop the Collection",
  ctaHref: "/collections/all",
  items: [
    {
      id: "look-01",
      src: "/assets/images/musafir-look-01.jpg",
      alt: "MUSAFIR black blazer with turtleneck",
      label: "Evening Blazer",
      href: "/collections/coats-blazers",
      tone: "photo",
    },
    {
      id: "look-02",
      src: "/assets/images/musafir-look-02.jpg",
      alt: "MUSAFIR black double-breasted suit",
      label: "Black Suit",
      href: "/collections/coats-blazers",
      tone: "photo",
    },
    {
      id: "look-03",
      src: "/assets/images/musafir-look-03.jpg",
      alt: "MUSAFIR formal black suit look",
      label: "Formal Set",
      href: "/collections/matching-pairs",
      tone: "photo",
    },
    {
      id: "look-04",
      src: "/assets/images/musafir-look-04.jpg",
      alt: "MUSAFIR smart casual black jacket look",
      label: "Smart Casual",
      href: "/collections/new",
      tone: "photo",
    },
    {
      id: "look-05",
      src: "/assets/images/musafir-look-05.jpg",
      alt: "MUSAFIR editorial seated formal look",
      label: "Editorial",
      href: "/collections/shirts",
      tone: "photo",
    },
    {
      id: "look-06",
      src: "/assets/images/musafir-look-06.jpg",
      alt: "MUSAFIR charcoal suit with plum tie",
      label: "Charcoal Suit",
      href: "/collections/coats-blazers",
      tone: "photo",
    },
  ],
};

const pool = new pg.Pool({ connectionString: databaseUrl() });
const client = await pool.connect();
try {
  await client.query("begin");
  const sf = await client.query("select content from storefront_setting where setting_key = 'default'");
  const content = sf.rows[0]?.content ?? {};
  content.riderGallery = gallery;
  await client.query("update storefront_setting set content = $1::jsonb where setting_key = 'default'", [
    JSON.stringify(content),
  ]);
  await client.query("commit");
  console.log("riderGallery updated:", gallery.title, gallery.titleMark, `(${gallery.items.length} looks)`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
