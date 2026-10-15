# Post-deploy smoke

## Automated

With Frontend on `:3000` and Backend on `:5000`:

```bash
node scripts/smoke-deploy.mjs
```

Optional full local verify (register + COD path):

```bash
npm run verify:local
```

## Manual checklist

- [ ] `GET /api/v1/health` returns OK
- [ ] Homepage loads; primary CTA visible
- [ ] Collection / PDP load with product images
- [ ] Add to bag → checkout form accepts PK phone + 5-digit postal
- [ ] Place COD order → confirmation shows order number
- [ ] Guest order lookup with email + order number
- [ ] Admin login → orders list → status change pending → processing
- [ ] Online payment control remains absent / disabled
- [ ] No secrets in HTML source or public JSON errors

## Readiness

Backend readiness is the same health endpoint used by Compose:

`GET http://127.0.0.1:5000/api/v1/health`

Compose backend `healthcheck` already probes this before attaching the frontend.
