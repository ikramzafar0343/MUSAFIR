# Secrets handling

## Rules

- Never bake `.env` into Docker images. Mount or inject at runtime (`env_file: /etc/musafir/*.env`).
- Rotate `HMAC_SIGNING_SECRET` and `SESSION_SECRET` together on Frontend + Backend (mismatched HMAC breaks all signed API calls; mismatched session secret invalidates cookies).
- After rotation: restart both services; users must re-login.
- Keep `SEED_ADMIN_PASSWORD` out of production images; change the seeded admin password on first boot.
- SMTP / WhatsApp tokens are optional — services must degrade gracefully when unset.

## CI

CI uses disposable placeholder secrets for build/typecheck only. Production secrets never belong in GitHub Actions variables unless encrypted and scoped.

## Audit

`npm run audit` (Backend + Frontend) runs in CI at `--audit-level=high`.
