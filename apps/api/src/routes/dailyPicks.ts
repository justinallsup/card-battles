import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { db } from '../db';
import { dailyPicks, dailyPickEntries, cardAssets } from '../db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { authRequired, optionalAuth } from '../middleware/auth';
import { z } from 'zod';

const router = new Hono<{ Variables: AppVariables }>();

async function enrichPick(pick: typeof dailyPicks.$inferSelect, userId?: string) {
  const [leftAsset] = await db
    .select()
    .from(cardAssets)
    .where(eq(cardAssets.id, pick.leftAssetId))
    .limit(1);
  const [rightAsset] = await db
    .select()
    .from(cardAssets)
    .where(eq(cardAssets.id, pick.rightAssetId))
    .limit(1);

  let myEntry: string | null = null;
  if (userId) {
    const [entry] = await db
      .select()
      .from(dailyPickEntries)
      .where(and(eq(dailyPickEntries.dailyPickId, pick.id), eq(dailyPickEntries.userId, userId)))
      .limit(1);
    myEntry = entry?.choice ?? null;
  }

  return {
    ...pick,
    left: { assetId: leftAsset?.id, title: leftAsset?.title, imageUrl: leftAsset?.imageUrl, thumbUrl: leftAsset?.thumbUrl, playerName: leftAsset?.playerName },
    right: { assetId: rightAsset?.id, title: rightAsset?.title, imageUrl: rightAsset?.imageUrl, thumbUrl: rightAsset?.thumbUrl, playerName: rightAsset?.playerName },
    myEntry,
  };
}

// GET /api/v1/daily-picks/current
router.get('/current', optionalAuth, async (c) => {
  const userId = c.get('userId') as string | undefined;
  const now = new Date();

  const picks = await db
    .select()
    .from(dailyPicks)
    .where(and(lte(dailyPicks.startsAt, now), gte(dailyPicks.endsAt, now)));

  const enriched = await Promise.all(picks.map((p) => enrichPick(p, userId)));
  return c.json(enriched);
});

// POST /api/v1/daily-picks/:id/enter
router.post('/:id/enter', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { id: pickId } = c.req.param();
  const body = await c.req.json().catch(() => null);

  const schema = z.object({ choice: z.enum(['left', 'right']) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400);

  const [pick] = await db.select().from(dailyPicks).where(eq(dailyPicks.id, pickId)).limit(1);
  if (!pick) return c.json({ error: 'Daily pick not found' }, 404);
  if (new Date() > pick.endsAt) return c.json({ error: 'Pick period has ended' }, 400);

  try {
    await db.insert(dailyPickEntries).values({
      dailyPickId: pickId,
      userId,
      choice: parsed.data.choice,
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === '23505') return c.json({ error: 'Already entered this pick' }, 409);
    throw err;
  }

  return c.json({ message: 'Entry submitted', choice: parsed.data.choice }, 201);
});

// GET /api/v1/daily-picks/:id/result
router.get('/:id/result', async (c) => {
  const { id: pickId } = c.req.param();
  const [pick] = await db.select().from(dailyPicks).where(eq(dailyPicks.id, pickId)).limit(1);
  if (!pick) return c.json({ error: 'Daily pick not found' }, 404);
  return c.json({ id: pick.id, result: pick.result, resolutionMethod: pick.resolutionMethod });
});

export default router;
