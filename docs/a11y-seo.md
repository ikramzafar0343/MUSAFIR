# Accessibility and SEO (Phase 3)

## Automated

- Playwright viewport matrix: `npm run e2e:viewports` (home, collection, cart, FAQ).
- COD journey + guest lookup: `npm run e2e` (requires FE + BE).
- Sitemap includes published product URLs via `Frontend/src/app/sitemap.ts`.
- `robots.ts` disallows `/admin`, `/account`, `/checkout`, `/cart`.

## Lighthouse (manual / CI optional)

With the storefront running:

```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility,seo --quiet --chrome-flags="--headless"
npx lighthouse http://localhost:3000/collections/all --only-categories=accessibility,seo --quiet --chrome-flags="--headless"
```

Exit bar for COD go-live: no critical a11y/SEO blockers on public journeys; sitemap lists products.

## Content

- Currency defaults to PKR; checkout accepts Pakistan mobile + 5-digit postal codes.
