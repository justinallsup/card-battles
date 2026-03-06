import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/tournaments
// List all tournaments (open, active, complete)
router.get('/', async (c) => {
  const status = c.req.query('status'); // optional filter
  const sport = c.req.query('sport');   // optional filter
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  // TODO: implement with real DB
  // let query = db.select().from(tournaments);
  // if (status) query = query.where(eq(tournaments.status, status));
  // if (sport) query = query.where(eq(tournaments.sport, sport));
  // const items = await query.orderBy(desc(tournaments.createdAt)).limit(limit);
  // return c.json({ tournaments: items, total: items.length });

  return c.json({ tournaments: [], total: 0 });
});

// GET /api/v1/tournaments/:id
// Get tournament details including bracket
router.get('/:id', async (c) => {
  const { id } = c.req.param();

  // TODO: implement with real DB
  // const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
  // if (!tournament) return c.json({ error: 'Not found' }, 404);
  // return c.json(tournament);

  return c.json({ error: 'Not found' }, 404);
});

// POST /api/v1/tournaments
// Create a new tournament (admin or pro users)
router.post('/', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json().catch(() => ({}));
  const { name, sport, maxParticipants, startDate } = body as {
    name?: string;
    sport?: string;
    maxParticipants?: number;
    startDate?: string;
  };

  if (!name) return c.json({ error: 'name required' }, 400);

  // TODO: implement with real DB
  // const [tournament] = await db.insert(tournaments).values({
  //   name,
  //   sport: sport || 'mixed',
  //   createdByUserId: userId,
  //   maxParticipants: maxParticipants || 8,
  //   status: 'open',
  //   startDate: startDate ? new Date(startDate) : null,
  //   bracket: {},
  //   participants: [],
  // }).returning();
  // return c.json(tournament, 201);

  return c.json({
    id: crypto.randomUUID(),
    name,
    sport: sport || 'mixed',
    status: 'open',
    createdByUserId: userId,
    maxParticipants: maxParticipants || 8,
    participants: [],
    bracket: {},
    createdAt: new Date().toISOString(),
  }, 201);
});

// POST /api/v1/tournaments/:id/join
// Join an open tournament
router.post('/:id/join', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { id } = c.req.param();

  // TODO: implement with real DB
  // const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
  // if (!tournament) return c.json({ error: 'Tournament not found' }, 404);
  // if (tournament.status !== 'open') return c.json({ error: 'Tournament is not open for registration' }, 400);
  // try {
  //   await db.insert(tournamentParticipants).values({ tournamentId: id, userId });
  // } catch (e: unknown) {
  //   if ((e as { code?: string }).code === '23505') return c.json({ error: 'Already joined' }, 409);
  //   throw e;
  // }
  // return c.json({ joined: true, tournamentId: id, userId });

  return c.json({ joined: true, tournamentId: id, userId });
});

// GET /api/v1/tournaments/:id/bracket
// Get the tournament bracket
router.get('/:id/bracket', async (c) => {
  const { id } = c.req.param();

  // TODO: implement with real DB
  // const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
  // if (!tournament) return c.json({ error: 'Not found' }, 404);
  // return c.json({ tournamentId: id, bracket: tournament.bracket, rounds: [] });

  return c.json({ tournamentId: id, bracket: {}, rounds: [] });
});

export default router;
