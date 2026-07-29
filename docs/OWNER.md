# Owner Portal

## Access

1. Navigate to `/owner-login` (unlisted)
2. Authenticate as SUPER_OWNER
3. Enable Authenticator 2FA via `/api/auth/2fa/setup`
4. Dashboard at `/owner`

Live publisher automation is **only** available on the owner page (not public).

## Sections

**Publisher** · Dashboard · Revenue · Users · Games · Subscriptions · Credits · Analytics · Reports · Content · AI Studio · Notifications · Moderation · Advertisements · Server Status · Logs · Database · Backups · Settings

## Publisher (primary automation)

See [PUBLISHER.md](./PUBLISHER.md). Pipeline:

1. Create / update game draft
2. Generate screenshots/banners, SEO, social copy, Google Ads **draft**
3. Review
4. Publish on website (instant)
5. Queue YouTube / social / Ads for approval
6. Approve → export / manual publish (Google Ads never auto-launches)

## Capabilities

- Suspend / ban / delete users
- Grant/remove credits & premium
- Reset passwords & revoke sessions
- CRUD games, coupons, broadcasts
- Encrypted backups + one-click restore (settings)
- AI Studio generation persisted to `AiGeneratedContent`
- AdSense config + site ads kill-switch

Default owner: **J** (`jashuvawork@gmail.com`)
