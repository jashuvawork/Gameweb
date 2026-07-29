# Owner Publisher

Owner-only automation for JASHUVA GAMES. Accessible at `/owner` → **Publisher** (SUPER_OWNER).

## What it automates

1. Create / update a game draft (title, description, free/premium, trailer & screenshot URLs)
2. Generate promotional assets (thumbnails, banners, SEO, social captions, YouTube metadata, Google Ads **draft** copy)
3. Review generated content in the Owner UI
4. **Publish on the website immediately**
5. Optionally queue YouTube / social / Google Ads items for approval
6. Approve or reject each external item (export-only for Google Ads)

## What it never does

- Does **not** auto-upload to Google Ads or launch campaigns
- Does **not** auto-post to YouTube/social without your approval
- External “Approve” marks items ready for manual publish or a future OAuth-backed push

## API (SUPER_OWNER + JWT + 2FA in production)

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/owner/publisher/jobs` | List / create jobs |
| PATCH | `/api/owner/publisher/jobs/:id` | Update draft |
| POST | `/api/owner/publisher/jobs/:id/generate-assets` | SEO + marketing + ads draft + SVG art |
| POST | `/api/owner/publisher/jobs/:id/publish-site` | Upsert live `Game` row |
| POST | `/api/owner/publisher/jobs/:id/queue-external` | Queue review items |
| GET | `/api/owner/publisher/queue` | Review queue |
| POST | `/api/owner/publisher/queue/:id/review` | `approve` \| `reject` \| `export` |
| GET | `/api/owner/publisher/analytics` | Users, revenue, plays, publisher stats |
| GET/POST | `/api/owner/publisher/ads-config` | AdSense enable + slot IDs |
| GET | `/api/public/ads-flags` | Public ads on/off for the website |

## AdSense

Configure via Owner → Publisher → AdSense, or env:

- `NEXT_PUBLIC_ADSENSE_CLIENT`
- `NEXT_PUBLIC_ADSENSE_SLOT_BANNER`
- `NEXT_PUBLIC_ADSENSE_SLOT_INFEED`
- `NEXT_PUBLIC_ADSENSE_SLOT_MULTI`

Premium subscribers never see ads. Owner can disable site ads with `adsEnabled`.

## Migrate

```bash
cd apps/api && pnpm prisma:migrate
# or: pnpm prisma db push
```
