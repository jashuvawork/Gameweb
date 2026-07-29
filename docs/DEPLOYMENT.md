# Deployment

## Live

| Service | URL |
|---------|-----|
| Web (Vercel) | https://jgames.space |
| Vercel alias | https://jashuva-games.vercel.app |
| API (Railway) | https://api.jgames.space *(after Railway setup below)* |

## Targets

| Component | Platform |
|-----------|----------|
| `apps/web` | Vercel |
| `apps/api` | Railway |
| Domain / CDN | Vercel DNS (`jgames.space`) + optional Cloudflare |
| DB | Railway PostgreSQL |
| Cache | Railway Redis |

---

## Vercel (frontend) — already deployed

Project: **jashuva-games**  
Root directory: `apps/web`  
Domain: `jgames.space` + `www` → apex redirect

Redeploy:

```bash
export VERCEL_TOKEN=***   # rotate if exposed
pnpm exec vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```

Env (Production):

- `APP_URL=https://jgames.space`
- `NEXT_PUBLIC_API_URL=https://api.jgames.space/api`
- `API_URL=https://api.jgames.space`

After Railway is live, update those API URLs if your Railway public URL differs.

---

## Railway (backend API) — how to deploy

### Option A — Dashboard (recommended)

1. Go to [https://railway.app/new](https://railway.app/new) and sign in (GitHub).
2. **New Project** → **Deploy from GitHub repo** → select `jashuvawork/Gameweb`.
3. Prefer branch `main` (merge this PR first) or deploy from `cursor/jashuva-games-platform-9774`.
4. In the service settings:
   - **Builder**: Dockerfile
   - **Dockerfile path**: `docker/Dockerfile.api`
   - **Watch paths**: `apps/api/**`, `packages/shared/**`, `docker/Dockerfile.api`
5. Click **Add Service** → **Database** → **PostgreSQL**.
6. Click **Add Service** → **Database** → **Redis**.
7. Open the **API service** → **Variables** → add:

```env
NODE_ENV=production
PORT=4000
APP_URL=https://jgames.space
CORS_ORIGINS=https://jgames.space,https://www.jgames.space
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-long-random>
JWT_REFRESH_SECRET=<generate-long-random>
COOKIE_SECRET=<generate-long-random>
OWNER_NAME=J
OWNER_EMAIL=jashuvawork@gmail.com
OWNER_PASSWORD=<strong-unique-password>
TWO_FACTOR_ENFORCE=false
# set true after you enable 2FA on first login
```

Generate secrets:

```bash
openssl rand -hex 48   # JWT_SECRET
openssl rand -hex 48   # JWT_REFRESH_SECRET
openssl rand -hex 32   # COOKIE_SECRET
openssl rand -base64 24  # OWNER_PASSWORD
```

8. **Settings → Networking → Generate Domain** (Railway gives `*.up.railway.app`).
9. Optional custom domain: add `api.jgames.space`:
   - Railway → service → **Custom Domain** → `api.jgames.space`
   - In Vercel Domains/DNS for `jgames.space`, add a **CNAME**:
     - Host: `api`
     - Target: your Railway service domain (e.g. `jashuva-api-production.up.railway.app`)
10. Redeploy. Health check: `GET https://api.jgames.space/api/health`
11. On first boot the API creates the **SUPER_OWNER** from `OWNER_*` vars.
12. Update Vercel env `NEXT_PUBLIC_API_URL` / `API_URL` to that API URL and redeploy web.

### Option B — Railway CLI

```bash
npm i -g @railway/cli
railway login
cd /path/to/Gameweb
railway init          # create project
railway add --database postgres
railway add --database redis
railway link

# Set variables (or paste in dashboard)
railway variables set NODE_ENV=production PORT=4000 \
  APP_URL=https://jgames.space \
  CORS_ORIGINS=https://jgames.space \
  OWNER_NAME=J \
  OWNER_EMAIL=jashuvawork@gmail.com \
  OWNER_PASSWORD='...' \
  JWT_SECRET='...' \
  JWT_REFRESH_SECRET='...' \
  COOKIE_SECRET='...' \
  TWO_FACTOR_ENFORCE=false

# Point DATABASE_URL / REDIS_URL at Railway plugin refs in dashboard UI
railway up            # deploy using docker/Dockerfile.api (see railway.json)
railway domain        # generate public URL
```

`railway.json` in the repo already points at `docker/Dockerfile.api` and healthcheck `/api/health`.

### After API is up

1. Visit https://jgames.space — frontend already live.
2. Hidden owner login: https://jgames.space/owner-login  
   Email: `jashuvawork@gmail.com` / password from `OWNER_PASSWORD`.
3. Enable 2FA, then set `TWO_FACTOR_ENFORCE=true` on Railway.

---

## Cloudflare (optional)

Domain currently uses **Vercel nameservers**. You can keep that (simplest).

If you move DNS to Cloudflare later:

- Apex `jgames.space` → Vercel (A/ALIAS as Vercel docs show)
- `www` → Vercel
- `api` → Railway CNAME
- Cache `/_next/static/*`; WAF rate-limit `/api/auth/*` and `/api/owner/*`

---

## Stripe / OAuth / Firebase / Ads

Set keys from `.env.example` on both Vercel (public keys) and Railway (secrets). Store/OAuth degrade gracefully without keys.
