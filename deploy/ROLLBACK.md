# Release and rollback

## Forward deploy

1. Tag the image / git SHA you are shipping (`musafir-frontend:<sha>`, `musafir-backend:<sha>`).
2. Apply DB migrations forward only: `npm run migrate --prefix Backend` (or container entrypoint).
3. Roll backend then frontend (Compose `up -d --build` or pull tagged images).
4. Run smoke: `node scripts/smoke-deploy.mjs` (or `deploy/SMOKE.md` checklist).
5. Watch 5xx / checkout errors for 15–30 minutes.

## Migration notes

- Migrations live in `Database/migrations` and are applied in filename order.
- Prefer **additive** migrations (new columns nullable, new tables). Avoid destructive drops in the same release as app code that still depends on old columns.
- If a migration must be reversed, add a **new** forward migration that undoes it — do not edit applied files.

## Rollback procedure

1. Decide: app-only rollback vs app + data.
2. **App-only** (preferred): redeploy previous image tags; leave DB as-is if schema is backward compatible.
3. **Schema rollback**: only if you have a tested reverse migration and a verified pre-deploy dump (`deploy/BACKUP.md`). Restore dump to a staging clone first.
4. Re-run smoke against the rolled-back stack.
5. Postmortem: note SHA, time, and customer impact.

## Compose example

```bash
# Redeploy previous known-good images
export BACKEND_IMAGE=musafir-backend:PREVIOUS_SHA
export FRONTEND_IMAGE=musafir-frontend:PREVIOUS_SHA
docker compose -f deploy/docker/docker-compose.yml up -d
```
