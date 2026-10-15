# MUSAFIR production readiness tracker

COD-first go-live. Payment gateway is Phase 5 (not a launch blocker).

| Phase | Item | Status |
| --- | --- | --- |
| 1 | GitHub Actions CI (lint, typecheck, audit, unit, build) | Done |
| 1 | Commerce / checkout / authorize unit tests | Done |
| 1 | API integration script (HMAC, COD, idempotency, IDOR lookup) | Done |
| 1 | Playwright E2E (browse/cart/COD/lookup + viewports) | Done |
| 1 | `npm run verify` + `verify:local` + `smoke` | Done |
| 2 | Enforce `PERMISSIONS` on admin API + FE actions | Done |
| 2 | Negative schema / unsigned HMAC / guest IDOR checks | Done |
| 2 | Secrets docs | Done |
| 3 | Product URLs in sitemap | Done |
| 3 | Viewport / a11y Playwright coverage | Done |
| 4 | Backup / restore / rollback / smoke / monitoring docs | Done |
| 5 | Payment flags + webhook stub + docs (COD coexistence) | Scaffolded |

Human gates before each production cut: UAT sign-off, business-owner approval.
