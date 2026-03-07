import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';
import { db } from '../db';
import { battleComments, battles, users } from '../db/schema';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/battles/:battleId/comments
// Returns comments for a battle, paginated, newest first
router.get('/:battleId/comments', async (c) => {
  const { battleId } = c.req.param();
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  const comments = await db
    .select({
      id: battleComments.id,
      battleId: battleComments.battleId,
      userId: battleComments.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      text: battleComments.text,
      likes: battleComments.likes,
      createdAt: battleComments.createdAt,
    })
    .from(battleComments)
    .innerJoin(users, eq(users.id, battleComments.userId))
    .where(eq(battleComments.battleId, battleId))
    .orderBy(desc(battleComments.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(battleComments)
    .where(eq(battleComments.battleId, battleId));

  return c.json({
    comments,
    total: countResult?.count ?? 0,
    battleId,
    limit,
    offset,
  });
});

// POST /api/v1/battles/:battleId/comments
// Post a new comment on a battle
router.post('/:battleId/comments', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { battleId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const { text } = body as { text?: string };

  if (!text?.trim() || text.length > 280) {
    return c.json({ error: 'Text required (max 280 chars)' }, 400);
  }

  // Verify battle exists
  const [battle] = await db
    .select({ id: battles.id })
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);

  if (!battle) return c.json({ error: 'Battle not found' }, 404);

  const [comment] = await db
    .insert(battleComments)
    .values({ battleId, userId, text: text.trim() })
    .returning();

  // Fetch username for response
  const [user] = await db
    .select({ username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return c.json({ ...comment, username: user?.username ?? null, avatarUrl: user?.avatarUrl ?? null }, 201);
});

// POST /api/v1/battles/:battleId/comments/:commentId/like
// Like a comment
router.post('/:battleId/comments/:commentId/like', authRequired, async (c) => {
  const { battleId, commentId } = c.req.param();

  const [comment] = await db
    .select({ id: battleComments.id })
    .from(battleComments)
    .where(eq(battleComments.id, commentId))
    .limit(1);

  if (!comment) return c.json({ error: 'Comment not found' }, 404);

  const [updated] = await db
    .update(battleComments)
    .set({ likes: sql`${battleComments.likes} + 1` })
    .where(eq(battleComments.id, commentId))
    .returning();

  return c.json({ id: commentId, battleId, likes: updated?.likes ?? 0 });
});

export default router;
