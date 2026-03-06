import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { db } from '../db';
import { users, userStats } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/users/:username
router.get('/:username', async (c) => {
  const { username } = c.req.param();
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      proStatus: users.proStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

// GET /api/v1/users/:username/stats
router.get('/:username/stats', async (c) => {
  const { username } = c.req.param();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) return c.json({ error: 'User not found' }, 404);

  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, user.id))
    .limit(1);

  return c.json(stats ?? { userId: user.id, votesCast: 0, battlesCreated: 0, battlesWon: 0, battlesLost: 0, currentStreak: 0, bestStreak: 0, dailyPickWins: 0, dailyPickLosses: 0 });
});

export default router;
