import { Hono } from 'hono';
import { db } from '../db';
import { sponsorClicks, battles, sponsors } from '../db/schema';
import { eq, count, desc, gte } from 'drizzle-orm';
import { optionalAuth } from '../middleware/auth';
import type { AppVariables } from '../types';

const router = new Hono<{ Variables: AppVariables }>();

// POST /api/v1/analytics/sponsor-click
// Track outbound sponsor link clicks and redirect
router.post('/sponsor-click', optionalAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.battleId || !body?.destinationUrl) {
    return c.json({ error: 'battleId and destinationUrl required' }, 400);
  }

  const userId = c.get('userId') as string | undefined;

  // Get battle to find sponsorId
  const [battle] = await db.select().from(battles).where(eq(battles.id, body.battleId)).limit(1);

  await db.insert(sponsorClicks).values({
    battleId: body.battleId,
    sponsorId: battle?.sponsorId ?? null,
    userId: userId ?? null,
    destinationUrl: body.destinationUrl,
  }).catch(() => {}); // non-blocking

  return c.json({ tracked: true, destinationUrl: body.destinationUrl });
});

// GET /api/v1/analytics/sponsor/:sponsorId/stats — admin only
router.get('/sponsor/:sponsorId/stats', async (c) => {
  const { sponsorId } = c.req.param();

  const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, sponsorId)).limit(1);
  if (!sponsor) return c.json({ error: 'Sponsor not found' }, 404);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const [clickStats] = await db
    .select({ total: count() })
    .from(sponsorClicks)
    .where(eq(sponsorClicks.sponsorId, sponsorId));

  const recentClicks = await db
    .select()
    .from(sponsorClicks)
    .where(eq(sponsorClicks.sponsorId, sponsorId))
    .orderBy(desc(sponsorClicks.createdAt))
    .limit(10);

  return c.json({
    sponsor: { id: sponsor.id, name: sponsor.name },
    totalClicks: clickStats?.total ?? 0,
    recentClicks,
  });
});

export default router;
