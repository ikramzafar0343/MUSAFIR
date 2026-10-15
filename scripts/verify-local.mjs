import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

const env = loadEnv(path.join(repo, "Backend", ".env"));
const prefix = env.API_PREFIX;
const secret = env.HMAC_SIGNING_SECRET;
const origin = env.APP_URL;

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function api(method, route, body) {
  const queryIndex = route.indexOf("?");
  const routePath = queryIndex >= 0 ? route.slice(0, queryIndex) : route;
  const query = queryIndex >= 0 ? route.slice(queryIndex) : "";
  const pathname = `${prefix}${routePath}`;
  const rawBody = body === undefined || method === "GET" ? "" : JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const canonical = `${method}\n${pathname}\n${timestamp}\n${nonce}\n${sha256Hex(rawBody)}`;
  const signature = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  const response = await fetch(`http://127.0.0.1:5000${pathname}${query}`, {
    method,
    headers: {
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": signature,
      Origin: origin,
      ...(rawBody ? { "Content-Type": "application/json" } : {}),
    },
    ...(rawBody ? { body: rawBody } : {}),
  });
  const json = response.status === 204 ? null : await response.json();
  return { status: response.status, json, setCookie: response.headers.getSetCookie?.() ?? [] };
}

const email = `local.user.${Date.now()}@example.com`;
const password = "LocalPass123!";

const home = await fetch("http://localhost:3000/");
if (!home.ok) throw new Error(`homepage ${home.status}`);
const html = await home.text();
if (!html.includes("Western Floral Saddle")) throw new Error("homepage missing seeded saddle");

const products = await api("GET", "/products?limit=8");
if (products.status !== 200) throw new Error(`products ${products.status} ${JSON.stringify(products.json)}`);
const product = products.json.data.products[0];
if (!product) throw new Error("no products returned");

const productPage = await fetch(`http://localhost:3000/product/${product.id}`);
if (!productPage.ok) throw new Error(`product page ${productPage.status}`);

const registered = await api("POST", "/auth/register", {
  name: "Local Rider",
  email,
  password,
  confirmPassword: password,
});
if (registered.status < 200 || registered.status >= 300) throw new Error(`register ${registered.status} ${JSON.stringify(registered.json)}`);

const login = await api("POST", "/auth/login", { email, password });
if (login.status < 200 || login.status >= 300) throw new Error(`login ${login.status} ${JSON.stringify(login.json)}`);

const adminStart = await api("POST", "/auth/admin/login", {
  email: env.SEED_ADMIN_EMAIL,
  password: env.SEED_ADMIN_PASSWORD,
});
if (adminStart.status < 200 || adminStart.status >= 300) {
  throw new Error(`admin login ${adminStart.status} ${JSON.stringify(adminStart.json)}`);
}

const challengeId = adminStart.json.data.challengeId;
const adminVerify = await api("POST", "/auth/admin/verify", {
  challengeId,
  otp: env.ADMIN_PASSCODE,
});
if (adminVerify.status < 200 || adminVerify.status >= 300) {
  throw new Error(`admin verify ${adminVerify.status} ${JSON.stringify(adminVerify.json)}`);
}

console.log(
  JSON.stringify(
    {
      homepage: home.status,
      products: products.json.data.products.map((item) => item.sku),
      productPage: productPage.status,
      register: registered.status,
      login: login.status,
      admin: adminVerify.status,
      adminEmail: adminVerify.json.data.user.email,
    },
    null,
    2,
  ),
);
