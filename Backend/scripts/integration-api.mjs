/**
 * API integration checks (HMAC + live Backend).
 * Requires Backend listening on 127.0.0.1:5000 with a migrated database.
 * Run: node Backend/scripts/integration-api.mjs
 */
import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
if (!existsSync(envPath)) {
  console.error("Missing Backend/.env — skip integration");
  process.exit(0);
}

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const env = loadEnv(envPath);
const prefix = env.API_PREFIX || "/api/v1";
const secret = env.HMAC_SIGNING_SECRET;
const origin = env.APP_URL || "http://localhost:3000";
const base = `http://127.0.0.1:${env.API_PORT || "5000"}`;

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function api(method, route, body, { cookie, signed = true } = {}) {
  const queryIndex = route.indexOf("?");
  const routePath = queryIndex >= 0 ? route.slice(0, queryIndex) : route;
  const query = queryIndex >= 0 ? route.slice(queryIndex) : "";
  const pathname = `${prefix}${routePath}`;
  const rawBody = body === undefined || method === "GET" ? "" : JSON.stringify(body);
  const headers = {
    Origin: origin,
    ...(rawBody ? { "Content-Type": "application/json" } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
  };
  if (signed) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = randomBytes(16).toString("hex");
    const canonical = `${method}\n${pathname}\n${timestamp}\n${nonce}\n${sha256Hex(rawBody)}`;
    headers["X-Timestamp"] = timestamp;
    headers["X-Nonce"] = nonce;
    headers["X-Signature"] = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  }
  const response = await fetch(`${base}${pathname}${query}`, {
    method,
    headers,
    ...(rawBody ? { body: rawBody } : {}),
  });
  const json = response.status === 204 ? null : await response.json().catch(() => null);
  const setCookie = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  return { status: response.status, json, setCookie };
}

function cookieHeader(setCookie) {
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

const health = await fetch(`${base}${prefix}/health`).catch(() => null);
if (!health?.ok) {
  console.error(`Backend not reachable at ${base}${prefix}/health — skip integration`);
  process.exit(0);
}

console.log("ok health");

const unsigned = await api("GET", "/products?limit=1", undefined, { signed: false });
assert.ok(unsigned.status === 401 || unsigned.status === 403, `unsigned expected 401/403 got ${unsigned.status}`);
console.log("ok unsigned HMAC rejected");

const products = await api("GET", "/products?limit=5");
assert.equal(products.status, 200, JSON.stringify(products.json));
const product = products.json?.data?.products?.[0];
assert.ok(product?.id, "need at least one product for checkout tests");
console.log("ok product list");

const email = `cod.int.${Date.now()}@example.com`;
const checkoutBody = {
  email,
  phone: "03001234567",
  fullName: "Integration Rider",
  address: "12 Test Street",
  city: "Lahore",
  postalCode: "54000",
  paymentMethod: "cod",
  items: [{ productId: product.id, quantity: 1 }],
};

const onlineRejected = await api("POST", "/orders", { ...checkoutBody, paymentMethod: "online" });
assert.ok(onlineRejected.status >= 400, "online payment must be rejected while COD-only");
console.log("ok online payment rejected");

const idemKey = `idem-${Date.now()}-${randomBytes(4).toString("hex")}`;
async function checkoutOnce() {
  const method = "POST";
  const routePath = "/orders";
  const pathname = `${prefix}${routePath}`;
  const rawBody = JSON.stringify(checkoutBody);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const canonical = `${method}\n${pathname}\n${timestamp}\n${nonce}\n${sha256Hex(rawBody)}`;
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": createHmac("sha256", secret).update(canonical, "utf8").digest("hex"),
      "Idempotency-Key": idemKey,
    },
    body: rawBody,
  });
  return { status: response.status, json: await response.json().catch(() => null) };
}

const first = await checkoutOnce();
assert.ok(first.status >= 200 && first.status < 300, `checkout failed ${first.status} ${JSON.stringify(first.json)}`);
const orderNumber = first.json?.data?.orderNumber;
assert.ok(orderNumber, "checkout missing orderNumber");
console.log("ok guest COD checkout", orderNumber);

const second = await checkoutOnce();
assert.ok(second.status >= 200 && second.status < 300, `idempotent retry failed ${second.status}`);
const secondNumber = second.json?.data?.orderNumber;
assert.equal(secondNumber, orderNumber, "idempotency key must reuse the same order");
console.log("ok idempotency reuse");

const lookup = await api("POST", "/orders/lookup", { orderNumber, email });
assert.ok(lookup.status >= 200 && lookup.status < 300, JSON.stringify(lookup.json));
console.log("ok guest lookup");

const badLookup = await api("POST", "/orders/lookup", { orderNumber, email: "other@example.com" });
assert.ok(badLookup.status === 404 || badLookup.status === 403, "IDOR: wrong email must not reveal order");
console.log("ok guest lookup IDOR");

const xss = await api("POST", "/orders", {
  ...checkoutBody,
  email: `xss.${Date.now()}@example.com`,
  fullName: "<img src=x onerror=alert(1)>",
});
assert.ok(xss.status >= 400, "XSS name must fail validation");
console.log("ok XSS name rejected");

const adminEmail = env.SEED_ADMIN_EMAIL || "admin@example.com";
const adminPassword = env.SEED_ADMIN_PASSWORD || "ChangeMeAdmin123!";
const login = await api("POST", "/auth/login", { email: adminEmail, password: adminPassword });
if (login.status >= 200 && login.status < 300) {
  const cookie = cookieHeader(login.setCookie);
  const orders = await api("GET", "/admin/orders?limit=5", undefined, { cookie });
  assert.equal(orders.status, 200, JSON.stringify(orders.json));
  const orderId = orders.json?.data?.orders?.[0]?.id ?? first.json?.data?.id;
  if (orderId) {
    const statusUpdate = await api("PATCH", `/admin/orders/${orderId}`, { status: "processing" }, { cookie });
    assert.ok(statusUpdate.status >= 200 && statusUpdate.status < 300, JSON.stringify(statusUpdate.json));
    console.log("ok admin order status transition");
  }
  console.log("ok admin orders list");
} else {
  console.log("skip admin login (seed credentials unavailable)");
}

console.log("Backend integration API tests passed");
