import pg from "pg";

import { databaseUrl } from "./db-url.mjs";

const pool = new pg.Pool({
  connectionString: databaseUrl(),
});

const cols = await pool.query(
  `select column_name, data_type from information_schema.columns
   where table_name = 'product' order by ordinal_position`,
);
console.log(cols.rows);

const imgCols = await pool.query(
  `select column_name from information_schema.columns where table_name = 'product_image' order by ordinal_position`,
);
console.log("product_image", imgCols.rows.map((r) => r.column_name));

await pool.end();
