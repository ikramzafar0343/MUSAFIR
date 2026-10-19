# Hostinger VPS + GoDaddy DNS (musafirss.store)

Production hostname: **https://musafirss.store**  
VPS IPv4: **72.61.19.3** (`ssh root@72.61.19.3`)

## 1. GoDaddy DNS (do first)

In GoDaddy → **musafirss.store** → **DNS** → **DNS Records**:

| Action | Type | Name | Value | TTL |
|--------|------|------|-------|-----|
| **Edit** A `@` (replace “Parked”) | A | `@` | `72.61.19.3` | 600s or 1 Hour |
| Keep | CNAME | `www` | `musafirss.store.` | 1 Hour |
| Leave | NS / SOA / `_domainconnect` / `_dmarc` | — | — | — |

Do **not** use GoDaddy “Connect domain / Airo” parking. Propagation is often minutes, up to ~1 hour.

Verify:

```bash
nslookup musafirss.store
nslookup www.musafirss.store
```

Both should resolve toward `72.61.19.3`.

## 2. Hostinger panel

- Firewall: allow **22**, **80**, **443**
- OS: Ubuntu 24.04 LTS
- Optional: snapshots before first deploy

## 3. Server packages

```bash
ssh root@72.61.19.3

apt update && apt install -y nginx certbot python3-certbot-nginx git curl
# Docker Engine + Compose plugin (official Docker docs for Ubuntu)
# Ensure Docker is running before compose up
```

Create the external proxy network (name must match Compose, or set `MUSAFIR_PROXY_NETWORK`):

```bash
docker network create aviosupportdesk_avion 2>/dev/null || true
```

## 4. Clone + env files

```bash
mkdir -p /var/www /etc/musafir /var/www/certbot
git clone https://github.com/ikramzafar0343/MUSAFIR.git /var/www/musafir
cd /var/www/musafir
```

Copy examples and edit **real** secrets (never commit them):

```bash
cp Backend/.env.example /etc/musafir/backend.env
cp Frontend/.env.example /etc/musafir/frontend.env
```

Required production values:

| File | Keys |
|------|------|
| `/etc/musafir/backend.env` | `APP_URL=https://musafirss.store`, `CORS_ORIGIN=https://musafirss.store,https://www.musafirss.store`, matching `HMAC_SIGNING_SECRET` + `SESSION_SECRET` (≥32 chars), `DATABASE_URL` / `DATABASE_MIGRATE_URL` pointing at Compose postgres (`postgresql://musafir:PASSWORD@postgres:5432/musafir`), `SEED_ADMIN_*`, `ADMIN_PASSCODE` |
| `/etc/musafir/frontend.env` | Same `APP_URL`, same HMAC/session secrets, `API_URL=http://musafir-backend-1:5000`, `API_PREFIX=/api/v1` |

Set Compose postgres password when starting:

```bash
export MUSAFIR_POSTGRES_PASSWORD='strong-random-password'
# DATABASE_URL password in backend.env must match
```

## 5. Shared VPS note (this Hostinger box)

This server already runs **zermae** / **marhas** / **greentech** on host nginx.
Use the **host-nginx** configs (not Docker DNS `127.0.0.11`):

| Service | Bind |
|---------|------|
| Frontend | `127.0.0.1:3020` |
| API | `127.0.0.1:5010` |

Do **not** use `:3000` / `:5000` (zermae).

## 6. nginx bootstrap (HTTP only)

```bash
cp /var/www/musafir/deploy/nginx/musafirss.store.host-http.conf /etc/nginx/sites-available/musafirss.store
ln -sf /etc/nginx/sites-available/musafirss.store /etc/nginx/sites-enabled/musafirss.store
nginx -t && systemctl reload nginx
```

## 7. Docker Compose

```bash
cd /var/www/musafir/deploy/docker
export MUSAFIR_POSTGRES_PASSWORD='strong-random-password-here'
# Put the SAME password into DATABASE_* in /etc/musafir/backend.env
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:5010/api/v1/health
curl -fsSI http://127.0.0.1:3020/
```

Migrate + seed:

```bash
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
```

## 8. TLS (Let's Encrypt)

```bash
certbot --nginx -d musafirss.store -d www.musafirss.store
# Then install the TLS site (or let certbot edit; prefer our host TLS file):
cp /var/www/musafir/deploy/nginx/musafirss.store.host.conf /etc/nginx/sites-available/musafirss.store
nginx -t && systemctl reload nginx
```

Confirm:

```bash
curl -fsSI https://musafirss.store/
curl -fsS https://musafirss.store/api/v1/health
```

## 8. Smoke

Follow [SMOKE.md](./SMOKE.md) against `https://musafirss.store` (homepage, COD checkout, admin login).

## Updates

```bash
cd /var/www/musafir
git pull --ff-only origin main
cd deploy/docker
docker compose build && docker compose up -d
```

Rollback: [ROLLBACK.md](./ROLLBACK.md). Secrets: [SECRETS.md](./SECRETS.md).
