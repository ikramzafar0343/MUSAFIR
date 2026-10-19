# MUSAFIR

Production storefront for **MUSAFIR** ([musafirss.store](https://musafirss.store)).

Monorepo: `Frontend` (Next.js) + `Backend` (Node API + Postgres).

VPS: Hostinger `72.61.19.3` — see [deploy/HOSTINGER.md](deploy/HOSTINGER.md) for GoDaddy DNS + Docker cutover.

## Local development

```bash
npm install --prefix Backend && npm install --prefix Frontend
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
npm run db:local && npm run db:migrate && npm run seed:admin
npm run dev
```

- Shop: http://localhost:3000  
- Admin: http://localhost:3000/admin/login  

## Production (Docker)

```bash
cd deploy/docker && docker compose build && docker compose up -d
# Include the upgrade map in nginx http{} (once):
#   include /var/www/musafir/deploy/nginx/musafir-map.conf;
# Site config: deploy/nginx/musafirss.store.conf (TLS)
#   or musafirss.store.http-only.conf (before certbot)
```

Full steps: [deploy/HOSTINGER.md](deploy/HOSTINGER.md) · smoke: [deploy/SMOKE.md](deploy/SMOKE.md)

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local API + Next |
| `npm run build` | Production build |
| `npm start` | Run built apps (uses `DATABASE_URL` from env) |
| `npm run db:migrate` | Migrations |
| `npm run seed:admin` | Create/update admin from `SEED_ADMIN_*` |
