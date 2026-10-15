/**
 * Lightweight post-deploy smoke (no user registration).
 * Expects Frontend :3000 and Backend :5000.
 */
import { createHash, createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(repo, "Backend", ".env");

function loadEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const env = loadEnv(envFile);
const prefix = env.API_PREFIX || "/api/v1";
const secret = env.HMAC_SIGNING_SECRET;
const corsOrigin = (env.CORS_ORIGIN || env.APP_URL || "http://localhost:3000").split(",")[0]?.trim();
const origin = corsOrigin || "http://localhost:3000";
const apiBase = process.env.SMOKE_API_URL || "http://127.0.0.1:5000";
const appBase = process.env.SMOKE_APP_URL || "http://localhost:3000";

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function signedGet(route, requestOrigin = origin) {
  const pathname = `${prefix}${route}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const canonical = `GET\n${pathname}\n${timestamp}\n${nonce}\n${sha256Hex("")}`;
  const signature = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  const response = await fetch(`${apiBase}${pathname}`, {
    headers: {
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": signature,
      Origin: requestOrigin,
    },
  });
  return { status: response.status, json: await response.json().catch(() => null) };
}

const health = await fetch(`${apiBase}${prefix}/health`);
if (!health.ok) throw new Error(`health ${health.status}`);
console.log("ok health");

const home = await fetch(`${appBase}/`);
if (!home.ok) throw new Error(`homepage ${home.status}`);
console.log("ok homepage");

if (!secret) {
  console.log("skip signed product list (no HMAC_SIGNING_SECRET)");
} else {
  let products = await signedGet("/products?limit=3");
  if (products.status !== 200 && origin !== "http://localhost:3000") {
    products = await signedGet("/products?limit=3", "http://localhost:3000");
  }
  if (products.status !== 200) {
    console.log(`warn products ${products.status} — check HMAC_SIGNING_SECRET match with running Backend`);
  } else {
    console.log("ok products", products.json?.data?.products?.length ?? 0);
  }
}

const robots = await fetch(`${appBase}/robots.txt`);
if (!robots.ok) throw new Error(`robots ${robots.status}`);
console.log("ok robots");

const sitemap = await fetch(`${appBase}/sitemap.xml`);
if (!sitemap.ok) throw new Error(`sitemap ${sitemap.status}`);
console.log("ok sitemap");

console.log("smoke-deploy passed");
