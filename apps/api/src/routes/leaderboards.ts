import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { db } from '../db';
import { userStats, users } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/leaderboards?type=creators&period=week
router.get('/', async (c) => {
  const type = (c.req.query('type') || 'creators') as 'creators' | 'voters';
  const period = (c.req.query('period') || 'week') as 'day' | 'week' | 'month' | 'all';
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  const orderBy = type === 'creators' ? userStats.battlesWon : userStats.votesCast;

  const rows = await db
    .select({
      userId: userStats.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      battlesWon: userStats.battlesWon,
      votesCast: userStats.votesCast,
      currentStreak: userStats.currentStreak,
    })
    .from(userStats)
    .innerJoin(users, eq(users.id, userStats.userId))
    .orderBy(desc(orderBy))
    .limit(limit);

  const items = rows.map((row, idx) => ({
    rank: idx + 1,
    userId: row.userId,
    username: row.username,
    avatarUrl: row.avatarUrl,
    score: type === 'creators' ? row.battlesWon : row.votesCast,
    battlesWon: row.battlesWon,
    votesCast: row.votesCast,
    streak: row.currentStreak,
  }));

  return c.json({ type, period, items });
});

export default router;
