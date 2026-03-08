# CardPulse Upload Implementation - Card-Asset-First Architecture

## Overview
Complete card upload system that creates reusable card assets for battles, pull posts, collections, and future features.

## ✅ Implemented

### 1. Database Schema (`0002_add_card_asset_fields.sql`)
- Added `grade` (varchar 30) - PSA/BGS grade
- Added `cert_number` (varchar 100) - certification number
- Added indexes on `player_name`, `year`, `source` for efficient queries

### 2. Schema Types (`apps/api/src/db/schema.ts`)
Updated `cardAssets` table with:
- `grade`, `certNumber` fields
- Indexes for performance
- Source types: `upload`, `seeded`, `url`

### 3. Image Processing (`apps/api/src/lib/imageProcessor.ts`)
- **processImage()**: Normalizes to WebP, generates thumbnails (400x600 max)
- **validateImageBuffer()**: Size validation (10MB max)
- **generateFallbackSvg()**: Dynamic SVG placeholders for failed loads

### 4. Upload API (`apps/api/src/routes/assets.ts`)

#### POST /api/v1/assets/upload
- Accepts multipart FormData
- Processes images with Sharp (normalize + thumbnail)
- Supports local storage or S3
- Fields: image, title, sport, playerName, year, setName, variant, grade, certNumber
- Returns asset ID for reuse

#### POST /api/v1/assets/create-from-url
- Creates asset from external URL
- Lightweight for quick imports
- Same metadata fields as upload

#### GET /api/v1/assets
- List/search assets
- Filters: sport, playerName, year, source, userId, search query
- Pagination: limit, offset

#### GET /api/v1/assets/:id
- Get single asset by ID

#### GET /api/v1/assets/:id/fallback.svg
- Generate SVG fallback on-demand
- Cached for 24h

### 5. Seeded Assets (`apps/api/src/seedAssets.ts`)
- Imports 8 demo cards (Jordan, Brady, LeBron, Trout, Mahomes, Luka, Gretzky, Kobe)
- Uses same schema as uploads
- `source: 'seeded'` for tracking
- Run: `pnpm --filter @card-battles/api run db:seed-assets`

### 6. Web UI (`apps/web/app/(app)/create/page.tsx`)
Updated CardInput interface and upload form:
- Year input
- Set name input
- Variant input (e.g., Refractor, Silver)
- Grade input (e.g., PSA 10, BGS 9.5)
- Cert number input
- Mobile-first responsive grid layout

#### Upload Flow
1. **Upload mode**: Converts base64 → Blob → FormData → /assets/upload
2. **URL mode**: JSON → /assets/create-from-url
3. **Search mode**: Selects existing asset (no upload)

### 7. Storage Strategy
- **Development**: Local filesystem (`./uploads`)
- **Production**: S3-compatible storage
- Environment-based toggle (no S3 credentials = local mode)

## 🔄 Migration Path

```bash
# 1. Apply migration
cd apps/api
pnpm run db:migrate

# 2. Install sharp
pnpm add sharp

# 3. Seed demo assets
pnpm run db:seed-assets

# 4. Install web dependencies
cd ../web
pnpm install
```

## 📁 Files Changed/Created

### New Files
- `apps/api/src/db/migrations/0002_add_card_asset_fields.sql`
- `apps/api/src/lib/imageProcessor.ts`
- `apps/api/src/seedAssets.ts`

### Modified Files
- `apps/api/src/db/schema.ts` - Added fields and indexes
- `apps/api/src/routes/assets.ts` - Enhanced upload API
- `apps/web/app/(app)/create/page.tsx` - Enhanced UI with new fields

## 🎯 Benefits

1. **Reusability**: Every upload creates a permanent asset
2. **No Master Catalog**: Organic library from community uploads
3. **Lightweight MVP**: Simple metadata, no complex card database
4. **Extensible**: Ready for collections, portfolios, Pulse pages
5. **Mobile-First**: Camera/photo upload support
6. **Graceful Degradation**: SVG fallbacks for failed images
7. **Performance**: Thumbnails, indexes, efficient queries

## 🚀 Future Expansion Ready

The asset system supports:
- Collection showcases
- Portfolio tracking
- Pulse by card pages
- Verification badges
- Breaker uploads
- Price tracking
- Watchlists

## 🔐 Security

- Auth required for uploads
- File type validation (JPEG, PNG, WebP, GIF)
- File size limits (10MB)
- Image processing validation (Sharp)
- User-scoped storage paths

## 🧪 Testing

```bash
# API tests
cd apps/api
pnpm test

# Upload test
curl -X POST http://localhost:3333/api/v1/assets/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@card.jpg" \
  -F "title=LeBron James RC" \
  -F "playerName=LeBron James" \
  -F "year=2003" \
  -F "grade=PSA 10"
```

## ✅ Checklist

- [x] Database migration
- [x] Schema updates
- [x] Image processing pipeline
- [x] Upload API (multipart)
- [x] Create-from-URL API
- [x] List/search API
- [x] Fallback SVG endpoint
- [x] Seeded assets script
- [x] Web UI form fields
- [x] FormData upload flow
- [ ] Install sharp dependency
- [ ] Run migrations
- [ ] Seed demo assets
- [ ] Test upload flows
- [ ] Verify mobile upload
- [ ] Test fallback behavior

## 📊 Next Steps

1. Install dependencies and run migrations
2. Test upload flow (file + URL)
3. Verify thumbnail generation
4. Test mobile camera upload
5. Seed demo assets
6. Update HEARTBEAT.md with progress
