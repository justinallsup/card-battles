import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';
import type { JwtPayload } from '../middleware/auth';
import { db } from '../db';
import { users, userFollows } from '../db/schema';

const router = new Hono<{ Variables: AppVariables }>();

// POST /api/v1/users/:username/follow
// Follow a user
router.post('/:username/follow', authRequired, async (c) => {
  const authUserId = c.get('userId') as string;
  const { username } = c.req.param();

  if (!username) return c.json({ error: 'Username required' }, 400);

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!target) return c.json({ error: 'User not found' }, 404);
  if (target.id === authUserId) return c.json({ error: 'Cannot follow yourself' }, 400);

  try {
    await db.insert(userFollows).values({ followerId: authUserId, followingId: target.id });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === '23505') {
      return c.json({ error: 'Already following' }, 409);
    }
    throw e;
  }

  return c.json({ following: true, username, targetId: target.id });
});

// POST /api/v1/users/:username/unfollow
// Unfollow a user
router.post('/:username/unfollow', authRequired, async (c) => {
  const authUserId = c.get('userId') as string;
  const { username } = c.req.param();

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!target) return c.json({ error: 'User not found' }, 404);

  await db
    .delete(userFollows)
    .where(and(eq(userFollows.followerId, authUserId), eq(userFollows.followingId, target.id)));

  return c.json({ following: false, username, targetId: target.id });
});

// GET /api/v1/users/:username/follow-status
// Get follow status for a user (optionally authenticated for isFollowing)
router.get('/:username/follow-status', async (c) => {
  const authHeader = c.req.header('Authorization');
  const { username } = c.req.param();

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!target) return c.json({ error: 'User not found' }, 404);

  const [followerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followingId, target.id));

  const [followingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followerId, target.id));

  // Check if the authenticated user is following this user
  let isFollowing = false;
  // We resolve the auth token manually if provided — keep it lightweight
  // (full authRequired middleware would redirect on failure, but we want optional auth here)
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      if (payload?.sub) {
        const [followRow] = await db
          .select({ followerId: userFollows.followerId })
          .from(userFollows)
          .where(and(eq(userFollows.followerId, payload.sub), eq(userFollows.followingId, target.id)))
          .limit(1);
        isFollowing = !!followRow;
      }
    } catch {
      // Not authenticated — that's fine
    }
  }

  return c.json({
    isFollowing,
    followerCount: followerCount?.count ?? 0,
    followingCount: followingCount?.count ?? 0,
    username,
    targetId: target.id,
  });
});

// GET /api/v1/users/:username/followers
// List users following this user
router.get('/:username/followers', async (c) => {
  const { username } = c.req.param();
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!target) return c.json({ error: 'User not found' }, 404);

  const followers = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      followedAt: userFollows.createdAt,
    })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followerId))
    .where(eq(userFollows.followingId, target.id))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followingId, target.id));

  return c.json({ items: followers, total: countResult?.count ?? 0, username });
});

// GET /api/v1/users/:username/following
// List users that this user follows
router.get('/:username/following', async (c) => {
  const { username } = c.req.param();
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!target) return c.json({ error: 'User not found' }, 404);

  const following = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      followedAt: userFollows.createdAt,
    })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followingId))
    .where(eq(userFollows.followerId, target.id))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollows)
    .where(eq(userFollows.followerId, target.id));

  return c.json({ items: following, total: countResult?.count ?? 0, username });
});

export default router;
