# Phase 5 — Payment gateway (post–COD go-live)

COD is live today. Online payments (card / JazzCash / Easypaisa) are **feature-flagged off**.

## Flags

| Variable | Where | Default | Meaning |
| --- | --- | --- | --- |
| `ONLINE_PAYMENTS_ENABLED` | Backend | `false` | Enable online payment APIs |
| `PAYMENT_PROVIDER` | Backend | `none` | `stripe` \| `jazzcash` \| `easypaisa` |
| `NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED` | Frontend | `false` | Show online payment UI |

## Scaffold already in repo

- `Backend/src/constants/payments.ts` — flags
- `Backend/src/server/api/payments/webhook.ts` — webhook stub (rejects until enabled)
- Checkout Zod schemas still accept **COD only** (`paymentMethod: "cod"`)

## When enabling

1. Choose provider; store secrets outside images (`/etc/musafir/*.env`).
2. Extend `PAYMENT_METHODS` / checkout schema beyond COD.
3. Implement webhook signature verify, idempotency, success/fail/cancel/refund.
4. Concurrency tests: no double-charge / duplicate orders.
5. Keep COD available unless business turns it off.
6. E2E + webhook integration tests in sandbox before production flag flip.

## Exit criteria

Sandbox payments + webhook reconciliation proven; production enable is a deliberate flag change.
