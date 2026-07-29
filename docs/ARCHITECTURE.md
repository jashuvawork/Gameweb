# Architecture

## Overview

Jgames is a monorepo PWA gaming platform designed for extreme lightness with a premium neon aesthetic.

```
Browser (PWA)
  └─ Next.js (SSR/Edge) ──CDN/Cloudflare──► static + SSR
       └─ REST/GraphQL ──► NestJS API
                              ├─ Prisma → PostgreSQL
                              ├─ Redis (sessions, rate limits, cache)
                              ├─ Stripe webhooks
                              └─ AI Studio generators
```

## Frontend

- App Router pages for home, library, play, store, profile, season pass
- Hidden owner portal (`/owner-login`, `/owner`) with `noindex` + `X-Robots-Tag`
- Redux Toolkit for auth/UI; TanStack Query for server state
- Framer Motion + canvas particles + procedural soundtrack
- PWA via `next-pwa` (offline caching, installable)

## Backend

- NestJS modules: auth, users, games, store, owner, ai, notifications, analytics, health
- GraphQL schema auto-generated for games queries
- JWT access tokens + hashed refresh tokens in DB sessions
- Argon2id passwords, optional TOTP 2FA, audit logs
- Throttling + CAPTCHA gate after failed logins

## Games

Universal engine in `games/engine/core.ts`. Games register in `games/registry.ts`. Adventure titles support endless procedural chapters (see Maze Escape).

## Scalability

- Game metadata in PostgreSQL; binaries/modules code-split by slug
- CDN for static assets; Redis for hot paths
- Horizontal API replicas behind Railway/Cloudflare
