#!/usr/bin/env bash
set -euo pipefail
echo "Jgames deploy helper"
echo "1) Push to main (triggers CI)"
echo "2) Vercel: link apps/web"
echo "3) Railway: deploy apps/api with DATABASE_URL + REDIS_URL"
echo "4) Cloudflare: proxy DNS + cache static assets"
echo "5) Set OWNER_* env vars once for SUPER_OWNER bootstrap"
echo "See docs/DEPLOYMENT.md"
