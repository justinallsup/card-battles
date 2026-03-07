/**
 * Fantasy Leagues Route
 *
 * Status: coming_soon — DB schema and migrations are ready (see 0001_social_features.sql).
 * Full fantasy scoring (pick-based card performance tracking across battles) is in development.
 * These endpoints return structured "coming soon" responses so frontend can handle gracefully.
 */
import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

const COMING_SOON = { status: 'coming_soon', message: 'This feature is in development' } as const;

// GET /api/v1/fantasy/leagues
router.get('/leagues', async (c) => {
  return c.json({ ...COMING_SOON, myLeagues: [], openLeagues: [] });
});

// POST /api/v1/fantasy/leagues
router.post('/leagues', authRequired, async (c) => {
  return c.json({ ...COMING_SOON }, 503);
});

// GET /api/v1/fantasy/leagues/:id
router.get('/leagues/:id', async (c) => {
  return c.json({ ...COMING_SOON, league: null });
});

// POST /api/v1/fantasy/leagues/:id/join
router.post('/leagues/:id/join', authRequired, async (c) => {
  return c.json({ ...COMING_SOON }, 503);
});

// POST /api/v1/fantasy/leagues/:id/pick
router.post('/leagues/:id/pick', authRequired, async (c) => {
  return c.json({ ...COMING_SOON }, 503);
});

// DELETE /api/v1/fantasy/leagues/:id/pick/:assetId
router.delete('/leagues/:id/pick/:assetId', authRequired, async (c) => {
  return c.json({ ...COMING_SOON }, 503);
});

// GET /api/v1/fantasy/leagues/:id/standings
router.get('/leagues/:id/standings', async (c) => {
  return c.json({ ...COMING_SOON, standings: [] });
});

export default router;
