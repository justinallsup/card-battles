import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';
import { db } from '../db';
import { cardAssets } from '../db/schema';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { processImage, validateImageBuffer, generateFallbackSvg } from '../lib/imageProcessor';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const router = new Hono<{ Variables: AppVariables }>();

const USE_S3 = process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY;
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads';
const PUBLIC_UPLOAD_BASE = process.env.PUBLIC_UPLOAD_BASE_URL || '/uploads';

let s3: S3Client | null = null;
if (USE_S3) {
  s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = process.env.S3_BUCKET || '';
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL || '';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (!s3 || !BUCKET) throw new Error('S3 not configured');
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));
  return `${PUBLIC_BASE}/${key}`;
}

async function uploadToLocal(buffer: Buffer, key: string): Promise<string> {
  const fullPath = join(LOCAL_UPLOAD_DIR, key);
  await mkdir(join(LOCAL_UPLOAD_DIR, key.split('/').slice(0, -1).join('/')), { recursive: true });
  await writeFile(fullPath, buffer);
  return `${PUBLIC_UPLOAD_BASE}/${key}`;
}

async function uploadImage(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (USE_S3) {
    return uploadToS3(buffer, key, contentType);
  } else {
    return uploadToLocal(buffer, key);
  }
}

// POST /api/v1/assets/upload
router.post('/upload', authRequired, async (c) => {
  const userId = c.get('userId') as string;

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: 'Invalid multipart form data' }, 400);
  }

  const file = formData.get('image') as File | null;
  if (!file) return c.json({ error: 'No image file provided' }, 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  if (!validateImageBuffer(buffer, MAX_SIZE)) {
    return c.json({ error: 'File too large. Maximum 10MB.' }, 400);
  }

  // Process image: normalize and create thumbnail
  let processed;
  try {
    processed = await processImage(buffer, file.type);
  } catch (err) {
    console.error('[Assets] Image processing failed:', err);
    return c.json({ error: 'Invalid image or processing failed' }, 400);
  }

  const assetId = randomUUID();
  const originalKey = `cards/${userId}/${assetId}.webp`;
  const thumbKey = `cards/${userId}/${assetId}_thumb.webp`;

  let imageUrl: string;
  let thumbUrl: string;
  try {
    imageUrl = await uploadImage(processed.original, originalKey, processed.originalMime);
    thumbUrl = await uploadImage(processed.thumbnail, thumbKey, processed.thumbnailMime);
  } catch (err) {
    console.error('[Assets] Upload failed:', err);
    return c.json({ error: 'Upload failed. Storage unavailable.' }, 503);
  }

  // Parse metadata from form
  const title = (formData.get('title') as string) || file.name.replace(/\.[^.]+$/, '');
  const sport = formData.get('sport') as string | null;
  const playerName = formData.get('playerName') as string | null;
  const yearStr = formData.get('year') as string | null;
  const setName = formData.get('setName') as string | null;
  const variant = formData.get('variant') as string | null;
  const grade = formData.get('grade') as string | null;
  const certNumber = formData.get('certNumber') as string | null;

  const [asset] = await db.insert(cardAssets).values({
    id: assetId,
    createdByUserId: userId,
    imageUrl,
    thumbUrl,
    title,
    sport,
    playerName,
    year: yearStr ? parseInt(yearStr) : null,
    setName,
    variant,
    grade,
    certNumber,
    source: 'upload',
    metadata: {
      width: processed.width,
      height: processed.height,
      originalFilename: file.name,
    },
  }).returning();

  return c.json(asset, 201);
});

// POST /api/v1/assets/create-from-url - Create asset from external URL
router.post('/create-from-url', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json();

  const title = body.title || 'Untitled Card';
  const imageUrl = body.imageUrl;
  
  if (!imageUrl) {
    return c.json({ error: 'imageUrl is required' }, 400);
  }

  const [asset] = await db.insert(cardAssets).values({
    createdByUserId: userId,
    imageUrl,
    thumbUrl: imageUrl, // Use same URL for external images
    title,
    sport: body.sport || null,
    playerName: body.playerName || null,
    year: body.year ? parseInt(body.year) : null,
    setName: body.setName || null,
    variant: body.variant || null,
    grade: body.grade || null,
    certNumber: body.certNumber || null,
    source: 'url',
    metadata: {
      externalUrl: true,
    },
  }).returning();

  return c.json(asset, 201);
});

// GET /api/v1/assets/:id
router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const { eq } = await import('drizzle-orm');
  const [asset] = await db.select().from(cardAssets).where(eq(cardAssets.id, id)).limit(1);
  if (!asset) return c.json({ error: 'Asset not found' }, 404);
  return c.json(asset);
});

// GET /api/v1/assets - List/search assets
router.get('/', async (c) => {
  const { eq, and, or, ilike, desc, sql } = await import('drizzle-orm');
  
  const sport = c.req.query('sport');
  const playerName = c.req.query('playerName');
  const year = c.req.query('year');
  const source = c.req.query('source');
  const userId = c.req.query('userId');
  const search = c.req.query('search');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  const conditions = [];
  if (sport) conditions.push(eq(cardAssets.sport, sport));
  if (year) conditions.push(eq(cardAssets.year, parseInt(year)));
  if (source) conditions.push(eq(cardAssets.source, source));
  if (userId) conditions.push(eq(cardAssets.createdByUserId, userId));
  if (playerName) conditions.push(ilike(cardAssets.playerName, `%${playerName}%`));
  if (search) {
    conditions.push(
      or(
        ilike(cardAssets.title, `%${search}%`),
        ilike(cardAssets.playerName, `%${search}%`),
        ilike(cardAssets.setName, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const assets = await db
    .select()
    .from(cardAssets)
    .where(where)
    .orderBy(desc(cardAssets.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ assets, limit, offset, count: assets.length });
});

// GET /api/v1/assets/:id/fallback.svg - Generate SVG fallback
router.get('/:id/fallback.svg', async (c) => {
  const { id } = c.req.param();
  const { eq } = await import('drizzle-orm');
  
  const [asset] = await db.select().from(cardAssets).where(eq(cardAssets.id, id)).limit(1);
  
  const title = asset?.title || 'Card';
  const playerName = asset?.playerName || undefined;
  
  const svg = await generateFallbackSvg(title, playerName);
  
  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=86400',
  });
});

export default router;
