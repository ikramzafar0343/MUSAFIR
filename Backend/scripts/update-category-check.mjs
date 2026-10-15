import pg from "pg";

import { databaseUrl } from "./db-url.mjs";

const pool = new pg.Pool({
  connectionString: databaseUrl(),
});

const constraints = await pool.query(`
  select conname, pg_get_constraintdef(oid) as def
  from pg_constraint
  where conrelid = 'product'::regclass and contype = 'c'
`);
console.log(constraints.rows);

await pool.query(`alter table product drop constraint if exists product_category_check`);
await pool.query(`
  alter table product
  add constraint product_category_check
  check (category in (
    'new-arrivals',
    'saddles',
    'bridles',
    'halters',
    'care',
    'serums',
    'creams',
    'cleansers',
    'body-care'
  ))
`);
console.log("product_category_check updated");

await pool.end();
