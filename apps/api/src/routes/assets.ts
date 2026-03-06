import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';
import { db } from '../db';
import { cardAssets } from '../db/schema';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const router = new Hono<{ Variables: AppVariables }>();

const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL!;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));
  return `${PUBLIC_BASE}/${key}`;
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
  if (buffer.length > MAX_SIZE) {
    return c.json({ error: 'File too large. Maximum 10MB.' }, 400);
  }

  const ext = file.type.split('/')[1] ?? 'jpg';
  const key = `cards/${userId}/${randomUUID()}.${ext}`;

  let imageUrl: string;
  try {
    imageUrl = await uploadToS3(buffer, key, file.type);
  } catch (err) {
    console.error('[Assets] S3 upload failed:', err);
    return c.json({ error: 'Upload failed. Storage unavailable.' }, 503);
  }

  // Parse metadata from form
  const title = (formData.get('title') as string) || file.name.replace(/\.[^.]+$/, '');
  const sport = formData.get('sport') as string | null;
  const playerName = formData.get('playerName') as string | null;
  const yearStr = formData.get('year') as string | null;
  const setName = formData.get('setName') as string | null;
  const variant = formData.get('variant') as string | null;

  const [asset] = await db.insert(cardAssets).values({
    createdByUserId: userId,
    imageUrl,
    thumbUrl: imageUrl, // use same URL for now; resize in v2
    title,
    sport,
    playerName,
    year: yearStr ? parseInt(yearStr) : null,
    setName,
    variant,
    source: 'upload',
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

export default router;
