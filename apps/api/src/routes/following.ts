import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

// POST /api/v1/users/:username/follow
// Follow a user
router.post('/:username/follow', authRequired, async (c) => {
  const authUserId = c.get('userId') as string;
  const { username } = c.req.param();

  if (!username) return c.json({ error: 'Username required' }, 400);

  // TODO: implement with real DB
  // const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  // if (!target) return c.json({ error: 'User not found' }, 404);
  // if (target.id === authUserId) return c.json({ error: 'Cannot follow yourself' }, 400);
  // try {
  //   await db.insert(userFollows).values({ followerId: authUserId, followingId: target.id });
  // } catch (e: unknown) {
  //   if ((e as { code?: string }).code === '23505') return c.json({ error: 'Already following' }, 409);
  //   throw e;
  // }
  // return c.json({ following: true, targetId: target.id });

  return c.json({ following: true, username });
});

// POST /api/v1/users/:username/unfollow
// Unfollow a user
router.post('/:username/unfollow', authRequired, async (c) => {
  const authUserId = c.get('userId') as string;
  const { username } = c.req.param();

  // TODO: implement with real DB
  // const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  // if (!target) return c.json({ error: 'User not found' }, 404);
  // await db.delete(userFollows).where(and(eq(userFollows.followerId, authUserId), eq(userFollows.followingId, target.id)));

  return c.json({ following: false, username });
});

// GET /api/v1/users/:username/follow-status
// Get follow status for a user (optionally authenticated for isFollowing)
router.get('/:username/follow-status', async (c) => {
  const { username } = c.req.param();

  // TODO: implement with real DB
  // const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  // if (!target) return c.json({ error: 'User not found' }, 404);
  // const followerCount = await db.select({ count: sql`count(*)` }).from(userFollows).where(eq(userFollows.followingId, target.id));
  // const followingCount = await db.select({ count: sql`count(*)` }).from(userFollows).where(eq(userFollows.followerId, target.id));
  // const isFollowing = authUserId ? await db.select().from(userFollows).where(and(eq(userFollows.followerId, authUserId), eq(userFollows.followingId, target.id))).limit(1) : [];
  // return c.json({ isFollowing: isFollowing.length > 0, followerCount: parseInt(followerCount[0].count as string), followingCount: parseInt(followingCount[0].count as string) });

  return c.json({ isFollowing: false, followerCount: 0, followingCount: 0, username });
});

// GET /api/v1/users/:username/followers
// List users following this user
router.get('/:username/followers', async (c) => {
  const { username } = c.req.param();
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  // TODO: implement with real DB
  // const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  // if (!target) return c.json({ error: 'User not found' }, 404);
  // const followers = await db.select({ ... }).from(userFollows).innerJoin(users, ...).where(eq(userFollows.followingId, target.id)).limit(limit);

  return c.json({ items: [], total: 0, username });
});

// GET /api/v1/users/:username/following
// List users that this user follows
router.get('/:username/following', async (c) => {
  const { username } = c.req.param();
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  // TODO: implement with real DB
  // const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  // if (!target) return c.json({ error: 'User not found' }, 404);
  // const following = await db.select({ ... }).from(userFollows).innerJoin(users, ...).where(eq(userFollows.followerId, target.id)).limit(limit);

  return c.json({ items: [], total: 0, username });
});

export default router;
