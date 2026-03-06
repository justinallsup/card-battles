import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/fantasy/leagues
// List leagues: my leagues + open leagues
router.get('/leagues', async (c) => {
  const authHeader = c.req.header('Authorization');
  // userId may not be set (no authRequired), but we can optionally use it
  // to filter "my leagues"

  // TODO: implement with real DB
  // const myLeagues = userId ? await db.select().from(fantasyLeagues).innerJoin(fantasyMembers, ...).where(eq(fantasyMembers.userId, userId)) : [];
  // const openLeagues = await db.select().from(fantasyLeagues).where(eq(fantasyLeagues.draftStatus, 'open')).limit(20);
  // return c.json({ myLeagues, openLeagues });

  return c.json({ myLeagues: [], openLeagues: [] });
});

// POST /api/v1/fantasy/leagues
// Create a new fantasy league
router.post('/leagues', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json().catch(() => ({}));
  const { name, maxTeams, pickDeadline } = body as {
    name?: string;
    maxTeams?: number;
    pickDeadline?: string;
  };

  if (!name) return c.json({ error: 'name required' }, 400);

  // TODO: implement with real DB
  // const [league] = await db.insert(fantasyLeagues).values({
  //   name,
  //   createdByUserId: userId,
  //   maxTeams: maxTeams || 8,
  //   draftStatus: 'open',
  //   pickDeadline: pickDeadline ? new Date(pickDeadline) : null,
  // }).returning();
  // // Auto-join creator
  // await db.insert(fantasyMembers).values({ leagueId: league.id, userId });
  // return c.json(league, 201);

  return c.json({
    id: crypto.randomUUID(),
    name,
    createdByUserId: userId,
    maxTeams: maxTeams || 8,
    draftStatus: 'open',
    members: [userId],
    picks: {},
    createdAt: new Date().toISOString(),
  }, 201);
});

// GET /api/v1/fantasy/leagues/:id
// Get league details, members, picks
router.get('/leagues/:id', async (c) => {
  const { id } = c.req.param();

  // TODO: implement with real DB
  // const [league] = await db.select().from(fantasyLeagues).where(eq(fantasyLeagues.id, id)).limit(1);
  // if (!league) return c.json({ error: 'League not found' }, 404);
  // const members = await db.select({ userId, username, picks }).from(fantasyMembers).innerJoin(users, ...).where(eq(fantasyMembers.leagueId, id));
  // return c.json({ ...league, members });

  return c.json({ error: 'League not found' }, 404);
});

// POST /api/v1/fantasy/leagues/:id/join
// Join a fantasy league
router.post('/leagues/:id/join', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { id } = c.req.param();

  // TODO: implement with real DB
  // const [league] = await db.select().from(fantasyLeagues).where(eq(fantasyLeagues.id, id)).limit(1);
  // if (!league) return c.json({ error: 'League not found' }, 404);
  // if (league.draftStatus !== 'open') return c.json({ error: 'League is not open for new members' }, 400);
  // try {
  //   await db.insert(fantasyMembers).values({ leagueId: id, userId });
  // } catch (e: unknown) {
  //   if ((e as { code?: string }).code === '23505') return c.json({ error: 'Already a member' }, 409);
  //   throw e;
  // }

  return c.json({ joined: true, leagueId: id, userId });
});

// POST /api/v1/fantasy/leagues/:id/pick
// Make a card pick for this fantasy league (add a card to your roster)
router.post('/leagues/:id/pick', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const { assetId } = body as { assetId?: string };

  if (!assetId) return c.json({ error: 'assetId required' }, 400);

  // TODO: implement with real DB
  // const [league] = await db.select().from(fantasyLeagues).where(eq(fantasyLeagues.id, id)).limit(1);
  // if (!league) return c.json({ error: 'League not found' }, 404);
  // Check membership, pick count limit (max 5), card not already picked by another member
  // const [membership] = await db.select().from(fantasyMembers).where(and(eq(fantasyMembers.leagueId, id), eq(fantasyMembers.userId, userId))).limit(1);
  // if (!membership) return c.json({ error: 'Not a member of this league' }, 403);
  // const existingPicks = membership.picks as string[] || [];
  // if (existingPicks.length >= 5) return c.json({ error: 'Max 5 picks per team' }, 400);
  // const updatedPicks = [...existingPicks, assetId];
  // await db.update(fantasyMembers).set({ picks: updatedPicks }).where(and(...));

  return c.json({ leagueId: id, userId, picks: [assetId] });
});

// DELETE /api/v1/fantasy/leagues/:id/pick/:assetId
// Remove a card from your roster
router.delete('/leagues/:id/pick/:assetId', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { id, assetId } = c.req.param();

  // TODO: implement with real DB
  // Remove assetId from member's picks array

  return c.json({ leagueId: id, userId, removed: assetId });
});

// GET /api/v1/fantasy/leagues/:id/standings
// Get league standings / leaderboard
router.get('/leagues/:id/standings', async (c) => {
  const { id } = c.req.param();

  // TODO: implement with real DB
  // Calculate standings based on how members' picked cards performed in battles

  return c.json({ leagueId: id, standings: [] });
});

export default router;
