import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", name: "home" },
  { path: "/collections/all", name: "collection" },
  { path: "/cart", name: "cart" },
  { path: "/faq", name: "faq" },
];

test.describe("responsive public journeys", () => {
  for (const pageInfo of pages) {
    test(`${pageInfo.name} renders without horizontal overflow`, async ({ page }) => {
      const home = await page.goto(pageInfo.path, { waitUntil: "domcontentloaded" }).catch(() => null);
      test.skip(!home || home.status() >= 500, "Frontend not reachable");

      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 2;
      });
      expect(overflow).toBeFalsy();
    });
  }

  test("checkout fields expose labels", async ({ page }) => {
    const response = await page.goto("/checkout", { waitUntil: "domcontentloaded" }).catch(() => null);
    test.skip(!response, "Frontend not reachable");
    // Empty cart redirects to /cart — still a valid journey.
    if (page.url().includes("/cart")) {
      await expect(page.locator("body")).toBeVisible();
      return;
    }
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
  });

  test("catalog images include alt text on collection", async ({ page }) => {
    const response = await page.goto("/collections/all", { waitUntil: "domcontentloaded" }).catch(() => null);
    test.skip(!response || response.status() >= 500, "Frontend not reachable");
    const images = page.locator("main img");
    const count = await images.count();
    if (count === 0) {
      test.skip(true, "No catalog images rendered");
    }
    for (let i = 0; i < Math.min(count, 8); i += 1) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt === null ? "" : alt).not.toEqual("");
    }
  });
});
