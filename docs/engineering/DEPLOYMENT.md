# Card Battles — Deployment Guide

## Local Development
```bash
cp .env.example .env
docker compose up --build
pnpm install && pnpm db:migrate && pnpm db:seed
# Web: http://localhost:3000  API: http://localhost:8000
```

## Production Stack

| Service | Provider |
|---------|----------|
| Web | Vercel |
| API | Railway or Fly.io |
| PostgreSQL | Railway Postgres or Supabase |
| Redis | Upstash |
| Storage | Cloudflare R2 or AWS S3 |

## Vercel (Web)
```bash
cd apps/web && vercel
# Set env: NEXT_PUBLIC_API_BASE_URL=https://your-api.railway.app/api/v1
```

## Railway (API)
- Root dir: `apps/api`
- Build: `pnpm build`
- Start: `node dist/index.js`

## Fly.io (API)
```bash
cd apps/api && fly launch --name card-battles-api
fly secrets set DATABASE_URL="..." JWT_SECRET="..."
fly deploy
```

## Required Production Env Vars
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
S3_BUCKET=card-battles-prod
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://your-bucket.s3.amazonaws.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_API_BASE_URL=https://api.cardbattles.app/api/v1
```
