/**
 * Smoke: homepage cold-load (iPhone) + admin routes.
 * Usage: node scripts/smoke-browser.mjs
 */
import { chromium, webkit } from "playwright";

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:3000";
const ADMIN_PATHS = [
  "/admin/login",
  "/admin",
  "/admin/customer-side",
  "/admin/inventory",
  "/admin/orders",
  "/admin/promos",
  "/admin/products/new",
];

const issues = [];

function note(msg) {
  console.log(msg);
  issues.push(msg);
}

async function checkPage(browserType, name, url, opts = {}) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    ...opts.context,
    bypassCSP: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  const started = Date.now();
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  const status = response?.status() ?? 0;
  await page.waitForTimeout(opts.waitMs ?? 2500);
  const title = await page.title();
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const elapsed = Date.now() - started;

  const heroPoster = await page.locator(".home-hero-poster, img.home-hero-poster").count().catch(() => 0);
  const heroCanvas = await page.locator(".home-hero-video-canvas").count().catch(() => 0);
  const overflow = await page.evaluate(() => document.body.style.overflow);

  console.log(`[${name}] ${url} status=${status} ${elapsed}ms title="${title}"`);
  if (status >= 500) note(`[${name}] HTTP ${status} on ${url}`);
  if (opts.expectHero) {
    if (heroPoster + heroCanvas < 1) note(`[${name}] missing hero poster/canvas`);
    else console.log(`[${name}] hero elements ok (poster=${heroPoster} canvas=${heroCanvas})`);
  }
  if (overflow === "hidden" && !opts.allowOverflowHidden) {
    note(`[${name}] body overflow stuck hidden on ${url}`);
  }
  const serious = consoleErrors.filter(
    (t) =>
      !t.includes("favicon") &&
      !t.includes("Download the React DevTools") &&
      !t.includes("net::ERR_"),
  );
  if (serious.length) {
    note(`[${name}] console: ${serious.slice(0, 5).join(" | ")}`);
  }
  if (opts.expectText && !bodyText.toLowerCase().includes(opts.expectText.toLowerCase())) {
    note(`[${name}] missing expected text "${opts.expectText}"`);
  }

  await browser.close();
  return { status, elapsed, consoleErrors: serious };
}

async function main() {
  console.log(`Smoke against ${BASE}`);

  // iPhone-ish WebKit homepage cold load
  try {
    await checkPage(webkit, "webkit-iphone", `${BASE}/en`, {
      context: {
        ...webkit.devices?.["iPhone 13"] || {
          viewport: { width: 390, height: 844 },
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          isMobile: true,
          hasTouch: true,
        },
      },
      expectHero: true,
      waitMs: 4000,
      expectText: "MUSAFIR",
    });
  } catch (error) {
    // WebKit may be unavailable on Windows without browsers installed
    note(`[webkit-iphone] skipped/failed: ${error instanceof Error ? error.message : error}`);
    await checkPage(chromium, "chromium-mobile", `${BASE}/en`, {
      context: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      expectHero: true,
      waitMs: 4000,
      expectText: "MUSAFIR",
    });
  }

  // Admin routes (login redirects expected for protected)
  for (const path of ADMIN_PATHS) {
    await checkPage(chromium, "admin", `${BASE}/en${path}`, {
      waitMs: 1500,
      allowOverflowHidden: path.includes("login") ? false : true,
    });
  }

  // Public storefront smoke
  for (const path of ["/en/collections/all", "/en/cart", "/en/checkout", "/en/contact"]) {
    await checkPage(chromium, "public", `${BASE}${path}`, { waitMs: 1200 });
  }

  console.log("\n--- summary ---");
  if (issues.length === 0) {
    console.log("No issues recorded.");
    process.exit(0);
  }
  for (const item of issues) console.log(item);
  process.exit(issues.some((i) => i.includes("HTTP 5") || i.includes("missing hero")) ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
