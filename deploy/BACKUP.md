# Postgres backup and restore

## Backup (staging / production)

From the host that can reach the Postgres container:

```bash
# Docker Compose service name: postgres
docker compose -f deploy/docker/docker-compose.yml exec -T postgres \
  pg_dump -U musafir -d musafir -Fc -f /tmp/musafir.dump

docker compose -f deploy/docker/docker-compose.yml cp postgres:/tmp/musafir.dump \
  ./backups/musafir-$(date +%Y%m%d-%H%M%S).dump
```

Local Windows (native Postgres on port 54321):

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path backups | Out-Null
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -d musafir -p 54321 -Fc -f "backups\musafir-$stamp.dump"
```

Store dumps off-box (object storage / encrypted volume). Never commit dumps to git.

## Restore drill

1. Stop writers (scale backend to 0 or put site in maintenance).
2. Restore into a **new** database first when possible; only overwrite production after verification.
3. Example restore into an empty DB:

```bash
docker compose -f deploy/docker/docker-compose.yml exec -T postgres \
  pg_restore -U musafir -d musafir --clean --if-exists /tmp/musafir.dump
```

4. Run `npm run migrate --prefix Backend` if the dump predates newer migrations.
5. Smoke: `node scripts/smoke-deploy.mjs` against the restored environment.
6. Confirm a known order number and admin login.

## Schedule

- Daily full dump; retain ≥ 7 days locally and ≥ 30 days off-site.
- Quarterly restore drill documented with date/operator in the ops log.
