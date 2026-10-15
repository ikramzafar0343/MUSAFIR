/**
 * Places a proper COD guest checkout against the local API.
 * Usage: node scripts/create-test-order.mjs
 */
import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { databaseUrl } from "./db-url.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[trimmed.slice(0, eq).trim()] = value;
  }
  return out;
}

const env = loadEnv(path.join(root, ".env"));
const prefix = env.API_PREFIX || "/api/v1";
const secret = env.HMAC_SIGNING_SECRET;
const origin = env.APP_URL || "http://localhost:3000";
if (!secret) {
  throw new Error("HMAC_SIGNING_SECRET missing in Backend/.env");
}

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function api(method, route, body, extraHeaders = {}) {
  const pathname = `${prefix}${route}`;
  const rawBody = body === undefined || method === "GET" ? "" : JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const canonical = `${method}\n${pathname}\n${timestamp}\n${nonce}\n${sha256Hex(rawBody)}`;
  const signature = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  const response = await fetch(`http://127.0.0.1:5000${pathname}`, {
    method,
    headers: {
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": signature,
      Origin: origin,
      ...(rawBody ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
    ...(rawBody ? { body: rawBody } : {}),
  });
  const json = response.status === 204 ? null : await response.json().catch(() => null);
  return { status: response.status, json };
}

const pool = new pg.Pool({ connectionString: databaseUrl() });
const products = await pool.query(
  `select id, sku, title, sizes, stock, price
   from product
   where deleted_at is null and status = 'published' and stock > 0
   order by updated_at desc
   limit 3`,
);
await pool.end();

if (products.rows.length === 0) {
  throw new Error("No published products with stock. Seed the catalog first.");
}

const items = products.rows.map((row, index) => ({
  productId: row.id,
  quantity: 1,
  size: Array.isArray(row.sizes) && row.sizes[0] ? row.sizes[0] : index === 0 ? "M" : null,
}));

const stamp = Date.now();
const payload = {
  email: `test.order.${stamp}@musafir.local`,
  phone: "03001234567",
  fullName: "Ikram Test Customer",
  address: "12 Gulberg III Main Boulevard",
  city: "Lahore",
  postalCode: "54000",
  paymentMethod: "cod",
  items,
  notes: "Local test order — cash on delivery.",
};

const idempotencyKey = sha256Hex(`test-order-${stamp}`);
const result = await api("POST", "/orders", payload, { "Idempotency-Key": idempotencyKey });

if (result.status < 200 || result.status >= 300) {
  console.error(JSON.stringify(result, null, 2));
  throw new Error(`Checkout failed with status ${result.status}`);
}

const order = result.json?.data ?? result.json;
console.log(
  JSON.stringify(
    {
      ok: true,
      orderNumber: order.orderNumber,
      email: order.email,
      customer: order.customer,
      city: order.city,
      postalCode: order.postalCode,
      paymentMethod: order.paymentMethod,
      status: order.status,
      currency: order.currency,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      items: (order.items ?? []).map((item) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
      })),
      adminOrders: `${origin}/admin/orders`,
      confirmation: `${origin}/order-confirmation/${order.orderNumber}`,
    },
    null,
    2,
  ),
);
