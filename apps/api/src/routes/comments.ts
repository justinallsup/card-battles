import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/battles/:battleId/comments
// Returns comments for a battle, paginated, newest first
router.get('/:battleId/comments', async (c) => {
  const { battleId } = c.req.param();
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  // TODO: implement with real DB
  // const comments = await db
  //   .select({ id, battleId, userId, username, text, createdAt, likes })
  //   .from(battleComments)
  //   .where(eq(battleComments.battleId, battleId))
  //   .orderBy(desc(battleComments.createdAt))
  //   .limit(limit)
  //   .offset(offset);
  // const total = await db.select({ count: sql`count(*)` }).from(battleComments).where(eq(battleComments.battleId, battleId));

  return c.json({ comments: [], total: 0, battleId });
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

  // TODO: implement with real DB
  // Verify battle exists
  // const [battle] = await db.select({ id: battles.id }).from(battles).where(eq(battles.id, battleId)).limit(1);
  // if (!battle) return c.json({ error: 'Battle not found' }, 404);
  // const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);
  // const [comment] = await db.insert(battleComments).values({ battleId, userId, username: user.username, text: text.trim() }).returning();
  // return c.json(comment, 201);

  return c.json({
    id: crypto.randomUUID(),
    battleId,
    userId,
    username: 'TODO',
    text: text.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
  }, 201);
});

// POST /api/v1/battles/:battleId/comments/:commentId/like
// Like a comment
router.post('/:battleId/comments/:commentId/like', authRequired, async (c) => {
  const { battleId, commentId } = c.req.param();

  // TODO: implement with real DB
  // const [comment] = await db.select().from(battleComments).where(eq(battleComments.id, commentId)).limit(1);
  // if (!comment) return c.json({ error: 'Comment not found' }, 404);
  // const [updated] = await db.update(battleComments).set({ likes: sql`likes + 1` }).where(eq(battleComments.id, commentId)).returning();
  // return c.json(updated);

  return c.json({ id: commentId, battleId, likes: 1 });
});

export default router;
