import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { db } from '../db';
import { battles, cardAssets, votes, users, userStats } from '../db/schema';
import { eq, and, lt, sql, desc, gt, asc } from 'drizzle-orm';
import { authRequired, optionalAuth } from '../middleware/auth';
import { voteRateLimit } from '../middleware/rateLimit';
import { z } from 'zod';
import { resolveBattle } from '../workers/battleResolution';

const router = new Hono<{ Variables: AppVariables }>();

const CATEGORIES = ['investment', 'coolest', 'rarity', 'long_term_hold'] as const;
const DEFAULT_CATEGORIES = ['investment', 'coolest', 'rarity'];

function calculateVoteWeight(accountCreatedAt: Date): number {
  const ageMs = Date.now() - accountCreatedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 1) return 0.25;
  if (ageDays < 7) return 0.5;
  if (ageDays < 30) return 0.75;
  return 1.0;
}

async function getBattleWithAssets(battleId: string) {
  const [battle] = await db
    .select()
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);
  if (!battle) return null;

  const [leftAsset] = await db
    .select()
    .from(cardAssets)
    .where(eq(cardAssets.id, battle.leftAssetId))
    .limit(1);
  const [rightAsset] = await db
    .select()
    .from(cardAssets)
    .where(eq(cardAssets.id, battle.rightAssetId))
    .limit(1);

  let creatorUsername: string | null = null;
  if (battle.createdByUserId) {
    const [creator] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, battle.createdByUserId))
      .limit(1);
    creatorUsername = creator?.username ?? null;
  }

  return {
    ...battle,
    createdByUsername: creatorUsername,
    left: {
      assetId: leftAsset.id,
      title: leftAsset.title,
      imageUrl: leftAsset.imageUrl,
      thumbUrl: leftAsset.thumbUrl,
      playerName: leftAsset.playerName,
    },
    right: {
      assetId: rightAsset.id,
      title: rightAsset.title,
      imageUrl: rightAsset.imageUrl,
      thumbUrl: rightAsset.thumbUrl,
      playerName: rightAsset.playerName,
    },
  };
}

// POST /api/v1/battles — create battle
router.post('/', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(500).optional(),
    leftAssetId: z.string().uuid(),
    rightAssetId: z.string().uuid(),
    categories: z.array(z.string()).min(1).max(4),
    durationSeconds: z.number().int().min(3600).max(172800), // 1h to 48h
    tags: z.record(z.string()).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { title, description, leftAssetId, rightAssetId, categories, durationSeconds, tags } =
    parsed.data;

  // Verify assets exist
  const [leftAsset] = await db
    .select({ id: cardAssets.id })
    .from(cardAssets)
    .where(eq(cardAssets.id, leftAssetId))
    .limit(1);
  const [rightAsset] = await db
    .select({ id: cardAssets.id })
    .from(cardAssets)
    .where(eq(cardAssets.id, rightAssetId))
    .limit(1);

  if (!leftAsset || !rightAsset) {
    return c.json({ error: 'One or both card assets not found' }, 404);
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + durationSeconds * 1000);

  const [battle] = await db
    .insert(battles)
    .values({
      createdByUserId: userId,
      leftAssetId,
      rightAssetId,
      title,
      description: description ?? null,
      categories,
      durationSeconds,
      startsAt: now,
      endsAt,
      tags: tags ?? {},
    })
    .returning();

  // Update stats
  await db
    .update(userStats)
    .set({
      battlesCreated: sql`battles_created + 1`,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));

  const full = await getBattleWithAssets(battle.id);
  return c.json(full, 201);
});

// GET /api/v1/battles/feed
router.get('/feed', optionalAuth, async (c) => {
  const cursor = c.req.query('cursor');
  const sport = c.req.query('sport');
  const status = c.req.query('status') || 'live';
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  const userId = c.get('userId') as string | undefined;

  const allBattles = await db
    .select()
    .from(battles)
    .where(eq(battles.status, status))
    .orderBy(desc(battles.createdAt))
    .limit(limit + 1);

  const hasMore = allBattles.length > limit;
  const items = allBattles.slice(0, limit);

  const enriched = await Promise.all(
    items.map(async (battle) => {
      const [leftAsset] = await db
        .select()
        .from(cardAssets)
        .where(eq(cardAssets.id, battle.leftAssetId))
        .limit(1);
      const [rightAsset] = await db
        .select()
        .from(cardAssets)
        .where(eq(cardAssets.id, battle.rightAssetId))
        .limit(1);

      let myVotes: Record<string, string> = {};
      if (userId) {
        const userVotes = await db
          .select()
          .from(votes)
          .where(and(eq(votes.battleId, battle.id), eq(votes.userId, userId)));
        myVotes = Object.fromEntries(userVotes.map((v) => [v.category, v.choice]));
      }

      return {
        ...battle,
        left: {
          assetId: leftAsset?.id,
          title: leftAsset?.title,
          imageUrl: leftAsset?.imageUrl,
          thumbUrl: leftAsset?.thumbUrl,
          playerName: leftAsset?.playerName,
        },
        right: {
          assetId: rightAsset?.id,
          title: rightAsset?.title,
          imageUrl: rightAsset?.imageUrl,
          thumbUrl: rightAsset?.thumbUrl,
          playerName: rightAsset?.playerName,
        },
        myVotes,
      };
    })
  );

  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return c.json({ items: enriched, nextCursor, total: items.length });
});

// GET /api/v1/battles/:id
router.get('/:id', optionalAuth, async (c) => {
  const { id } = c.req.param();
  const full = await getBattleWithAssets(id);
  if (!full) return c.json({ error: 'Battle not found' }, 404);

  const userId = c.get('userId') as string | undefined;
  let myVotes: Record<string, string> = {};
  if (userId) {
    const userVotes = await db
      .select()
      .from(votes)
      .where(and(eq(votes.battleId, id), eq(votes.userId, userId)));
    myVotes = Object.fromEntries(userVotes.map((v) => [v.category, v.choice]));
  }

  return c.json({ ...full, myVotes });
});

// POST /api/v1/battles/:id/vote
router.post('/:id/vote', authRequired, voteRateLimit, async (c) => {
  const userId = c.get('userId') as string;
  const { id: battleId } = c.req.param();
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    category: z.string().min(1),
    choice: z.enum(['left', 'right']),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { category, choice } = parsed.data;

  // Verify battle exists and is live
  const [battle] = await db
    .select()
    .from(battles)
    .where(and(eq(battles.id, battleId), eq(battles.status, 'live')))
    .limit(1);

  if (!battle) return c.json({ error: 'Battle not found or not active' }, 404);
  if (new Date() > battle.endsAt) return c.json({ error: 'Battle has ended' }, 400);

  const battleCategories = battle.categories as string[];
  if (!battleCategories.includes(category)) {
    return c.json({ error: 'Invalid category for this battle' }, 400);
  }

  // Get user for weight calculation
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.json({ error: 'User not found' }, 404);

  const weight = calculateVoteWeight(user.createdAt);

  // Insert vote (unique constraint will catch duplicates)
  try {
    await db.insert(votes).values({
      battleId,
      userId,
      category,
      choice,
      weight: weight.toFixed(3),
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === '23505') {
      return c.json({ error: 'Already voted in this category' }, 409);
    }
    throw err;
  }

  // Update totalVotesCached
  await db
    .update(battles)
    .set({
      totalVotesCached: sql`total_votes_cached + 1`,
      updatedAt: new Date(),
    })
    .where(eq(battles.id, battleId));

  // Update user stats
  await db
    .update(userStats)
    .set({ votesCast: sql`votes_cast + 1`, updatedAt: new Date() })
    .where(eq(userStats.userId, userId));

  // Get category results
  const categoryVotes = await db
    .select()
    .from(votes)
    .where(and(eq(votes.battleId, battleId), eq(votes.category, category)));

  const leftVotes = categoryVotes
    .filter((v) => v.choice === 'left')
    .reduce((sum, v) => sum + parseFloat(v.weight as string), 0);
  const rightVotes = categoryVotes
    .filter((v) => v.choice === 'right')
    .reduce((sum, v) => sum + parseFloat(v.weight as string), 0);
  const total = leftVotes + rightVotes;

  return c.json({
    battleId,
    category,
    userChoice: choice,
    leftPercent: total > 0 ? Math.round((leftVotes / total) * 100 * 10) / 10 : 50,
    rightPercent: total > 0 ? Math.round((rightVotes / total) * 100 * 10) / 10 : 50,
    totalVotesInCategory: categoryVotes.length,
  });
});

// GET /api/v1/battles/:id/results
router.get('/:id/results', async (c) => {
  const { id: battleId } = c.req.param();
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle) return c.json({ error: 'Battle not found' }, 404);

  const allVotes = await db.select().from(votes).where(eq(votes.battleId, battleId));
  const categories = battle.categories as string[];

  const byCategory: Record<string, {
    leftWeightedVotes: number;
    rightWeightedVotes: number;
    leftPercent: number;
    rightPercent: number;
    winner: string;
  }> = {};

  let categoryWins = { left: 0, right: 0 };
  let totalWeighted = 0;

  for (const cat of categories) {
    const catVotes = allVotes.filter((v) => v.category === cat);
    const left = catVotes
      .filter((v) => v.choice === 'left')
      .reduce((s, v) => s + parseFloat(v.weight as string), 0);
    const right = catVotes
      .filter((v) => v.choice === 'right')
      .reduce((s, v) => s + parseFloat(v.weight as string), 0);
    const total = left + right;
    totalWeighted += total;
    const winner = left > right ? 'left' : right > left ? 'right' : 'draw';
    if (winner === 'left') categoryWins.left++;
    else if (winner === 'right') categoryWins.right++;

    byCategory[cat] = {
      leftWeightedVotes: Math.round(left * 100) / 100,
      rightWeightedVotes: Math.round(right * 100) / 100,
      leftPercent: total > 0 ? Math.round((left / total) * 100 * 10) / 10 : 50,
      rightPercent: total > 0 ? Math.round((right / total) * 100 * 10) / 10 : 50,
      winner,
    };
  }

  const overallWinner =
    categoryWins.left > categoryWins.right
      ? 'left'
      : categoryWins.right > categoryWins.left
      ? 'right'
      : 'draw';

  return c.json({
    battleId,
    status: battle.status,
    result: battle.result,
    live: { byCategory, overall: { winner: overallWinner }, totalWeightedVotes: totalWeighted },
  });
});

// POST /api/v1/battles/:id/report
router.post('/:id/report', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { id: battleId } = c.req.param();
  const body = await c.req.json().catch(() => null);

  const schema = z.object({
    reason: z.string().min(1).max(100),
    notes: z.string().max(500).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400);

  const { db: reportDb } = await import('../db');
  const { reports } = await import('../db/schema');

  await reportDb.insert(reports).values({
    reporterUserId: userId,
    targetType: 'battle',
    targetId: battleId,
    reason: parsed.data.reason,
    notes: parsed.data.notes ?? null,
  });

  return c.json({ message: 'Report submitted' }, 201);
});

export default router;
