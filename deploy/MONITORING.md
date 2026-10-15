# Observability

## What to watch

| Signal | Source | Action |
| --- | --- | --- |
| 5xx rate | Reverse proxy / Backend logs (pino) | Page on-call; check last deploy |
| Checkout failures | Backend logs around `POST /orders` | Confirm stock, Zod validation, DB |
| Health flap | Compose healthcheck on `/api/v1/health` | Restart backend; check Postgres |
| Auth spikes | Login / admin OTP routes | Rate limits already apply; investigate abuse |

## Structured errors

Backend uses operational `AppError` with stable codes. Log aggregators should alert on `statusCode >= 500` and on elevated `VALIDATION_FAILED` / checkout error rates — **never** log raw HMAC secrets, session tokens, or payment provider keys.

## Optional Sentry

Set `SENTRY_DSN` (when wired) on Backend and Frontend. Until then, ship logs to the host journal / Docker logging driver and alert on:

```text
statusCode>=500 OR route="/orders" AND level="error"
```

## Secrets

See `deploy/SECRETS.md`. Alerts and error digests must redact `Authorization`, `Cookie`, and `X-Signature`.
