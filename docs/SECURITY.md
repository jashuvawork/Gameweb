# Security

## Owner zero-trust

- Single `SUPER_OWNER` bootstrapped from env only
- Hidden `/owner-login` — never linked publicly
- `robots.txt` disallows `/owner*` and `/admin*`
- Responses include `X-Robots-Tag: noindex, nofollow, noarchive`
- Owner APIs require JWT + `SUPER_OWNER` role + 2FA (enforced in production)
- Every owner action writes an `AuditLog`

## Auth

- Argon2id password hashing
- Short-lived JWT access tokens
- Rotating refresh tokens (SHA-256 hashed at rest)
- Session revoke-all
- Login history + device fingerprints
- Brute-force counters in Redis with CAPTCHA requirement
- Secure signed HTTP-only refresh cookies

## App security

- Helmet, CORS allowlist, class-validator DTOs
- Prisma parameterized queries (SQLi protection)
- XSS mitigated via React escaping + CSP-ready Helmet
- CSRF reduced via SameSite cookies + bearer tokens for APIs
- Rate limiting via Nest Throttler

## Roles

`SUPER_OWNER` > `ADMIN` > `MODERATOR` > `SUPPORT` > `USER`

No public registration path can create `SUPER_OWNER`.
