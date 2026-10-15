import pg from "pg";
import { databaseUrl } from "./db-url.mjs";

const EMPTY_CUSTOM_TACK = {
  title: "",
  titleAccent: "",
  lead: "",
  image: "",
  ctaLabel: "",
  ctaHref: "/collections/all",
  options: [],
};

const EMPTY_DISCIPLINES = {
  title: "",
  titleMark: "",
  support: "",
  ctaLabel: "",
  ctaHref: "/collections/all",
  items: [],
};

const pool = new pg.Pool({ connectionString: databaseUrl() });
const client = await pool.connect();
try {
  await client.query("begin");
  const sf = await client.query("select content from storefront_setting where setting_key = 'default'");
  const content = sf.rows[0]?.content ?? {};
  content.customTack = EMPTY_CUSTOM_TACK;
  content.disciplinesSection = EMPTY_DISCIPLINES;
  await client.query("update storefront_setting set content = $1::jsonb where setting_key = 'default'", [
    JSON.stringify(content),
  ]);
  await client.query("commit");
  console.log("cleared customTack + disciplinesSection");
  console.log(
    "riderGallery looks:",
    Array.isArray(content.riderGallery?.items) ? content.riderGallery.items.length : 0,
  );
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
