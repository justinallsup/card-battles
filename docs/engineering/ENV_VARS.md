# Environment Variables Reference

> **Source of truth:** `.env.example` at repo root.  
> Copy it with `cp .env.example .env` for local dev, then fill in real values.

---

## API (Railway / Fly.io)

Set these as Railway service variables or Fly secrets.

### General

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `APP_ENV` | ✅ | `production` | Runtime environment (`development` \| `production` \| `test`) |
| `PORT` | ❌ | `8000` | HTTP port (Railway injects this automatically) |

### Database

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/card_battles` | PostgreSQL connection string. Use Railway Postgres or Supabase in prod. |

### Redis

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | ✅ | `redis://default:token@host:6379` | Redis connection string. Use Upstash in prod (TLS URL: `rediss://...`). |

### JWT / Auth

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | *(64 random chars)* | HMAC secret for access tokens. Generate with `openssl rand -hex 32`. |
| `JWT_REFRESH_SECRET` | ✅ | *(64 random chars)* | HMAC secret for refresh tokens. Must differ from `JWT_SECRET`. |
| `JWT_ACCESS_EXPIRES_MINUTES` | ❌ | `60` | Access token TTL in minutes (default: 60). |
| `JWT_REFRESH_EXPIRES_DAYS` | ❌ | `30` | Refresh token TTL in days (default: 30). |

### Object Storage (S3 / R2)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `S3_ENDPOINT` | ❌ | `https://s3.amazonaws.com` | Custom endpoint — omit for AWS S3; set for R2/MinIO. |
| `S3_BUCKET` | ✅ | `card-battles-prod` | Bucket name for card art and uploads. |
| `S3_REGION` | ✅ | `us-east-1` | AWS region (or `auto` for R2). |
| `S3_ACCESS_KEY_ID` | ✅ | `AKIA...` | IAM access key (or R2 API token ID). |
| `S3_SECRET_ACCESS_KEY` | ✅ | `abc123...` | IAM secret key (or R2 API token secret). |
| `S3_PUBLIC_BASE_URL` | ✅ | `https://cdn.card-battles.com` | Public URL prefix for uploaded assets. |

### Stripe (Payments)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | ✅* | `sk_live_...` | Stripe server-side secret key. Use `sk_test_...` in dev. |
| `STRIPE_WEBHOOK_SECRET` | ✅* | `whsec_...` | Stripe webhook signing secret from your dashboard endpoint. |

*Required if payments feature is enabled.

---

## Web / Frontend (Vercel)

Set these as Vercel environment variables (Settings → Environment Variables).

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | `https://api.card-battles.up.railway.app/api/v1` | Full URL of the deployed API. No trailing slash. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅* | `pk_live_...` | Stripe client-side publishable key. |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ | `phc_abc123...` | PostHog project API key for analytics. |
| `NEXT_PUBLIC_POSTHOG_HOST` | ❌ | `https://app.posthog.com` | PostHog ingestion host (override for EU or self-hosted). |

*Required if payments feature is enabled.

---

## Generating Secrets

```bash
# JWT secrets (do this twice — one per secret)
openssl rand -hex 32

# Or with Node:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Railway Setup Checklist

1. Create a new Railway project
2. Add a **PostgreSQL** plugin → copy `DATABASE_URL`
3. Add a **Redis** plugin → copy `REDIS_URL` (or use Upstash)
4. Deploy from GitHub repo (root dir = repo root, not `apps/api`)
5. Set all API env vars above under **Variables**
6. Railway will run `railway.toml` build + deploy config automatically
7. Note the public URL → set it as `NEXT_PUBLIC_API_BASE_URL` in Vercel

## Vercel Setup Checklist

1. Import GitHub repo in Vercel dashboard
2. Framework preset: **Next.js**
3. Root Directory: `.` (monorepo root)
4. Build Command: `pnpm --filter @card-battles/web build`
5. Output Directory: `apps/web/.next`
6. Install Command: `pnpm install`
7. Set all `NEXT_PUBLIC_*` env vars under **Environment Variables**
8. Deploy!

---

## Local Development

```bash
cp .env.example .env
# Edit .env — fill in real Stripe keys if testing payments
docker compose up -d   # starts Postgres + Redis + MinIO
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev               # starts both API (8000) and Web (3000)
```
