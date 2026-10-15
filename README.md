# MUSAFIR

Production storefront for **MUSAFIR** ([musafir.com](https://musafir.com)).

Monorepo: `Frontend` (Next.js) + `Backend` (Node API + Postgres).

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
# Site config: deploy/nginx/musafir.com.conf (TLS) or musafir.com.http-only.conf
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local API + Next |
| `npm run build` | Production build |
| `npm start` | Run built apps (uses `DATABASE_URL` from env) |
| `npm run db:migrate` | Migrations |
| `npm run seed:admin` | Create/update admin from `SEED_ADMIN_*` |
