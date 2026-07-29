# Deployment

## Targets

| Component | Platform |
|-----------|----------|
| `apps/web` | Vercel |
| `apps/api` | Railway |
| Assets/DNS | Cloudflare CDN |
| DB | Railway PostgreSQL / managed Postgres |
| Cache | Railway Redis / Upstash |

## Environment

Copy `.env.example` → production secrets. **Required for first boot:**

```
OWNER_NAME=Jashuva
OWNER_EMAIL=jashuvawork@gmail.com
OWNER_PASSWORD=<strong unique secret>
JWT_SECRET=<64+ chars>
JWT_REFRESH_SECRET=<64+ chars>
COOKIE_SECRET=<32+ chars>
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
TWO_FACTOR_ENFORCE=true   # production
```

## Vercel

- Root directory: `apps/web`
- Install: `pnpm install` from monorepo root (enable pnpm)
- Build: `pnpm --filter @jashuva/web build`
- Env: `NEXT_PUBLIC_API_URL`, `APP_URL`

## Railway

- Dockerfile: `docker/Dockerfile.api` or Nixpack on `apps/api`
- Run migrate on release: `pnpm prisma:migrate`
- Health check: `GET /api/health`

## Cloudflare

- Proxy DNS to Vercel/Railway
- Cache `/_next/static/*`, images, fonts
- WAF rate rules on `/api/auth/*` and `/api/owner/*`

## Docker local prod-like

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Stripe / OAuth / Firebase / Ads

Set keys from `.env.example`. Store and OAuth degrade gracefully in development without keys.
