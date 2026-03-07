/**
 * Tournaments Route
 *
 * Status: coming_soon — DB schema and migrations are ready (see 0001_social_features.sql).
 * Full tournament bracket logic (seeding, round generation, match resolution) is in development.
 * These endpoints return structured "coming soon" responses so frontend can handle gracefully.
 */
import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

const COMING_SOON = { status: 'coming_soon', message: 'This feature is in development' } as const;

// GET /api/v1/tournaments
router.get('/', async (c) => {
  return c.json({ ...COMING_SOON, tournaments: [], total: 0 });
});

// GET /api/v1/tournaments/:id
router.get('/:id', async (c) => {
  return c.json({ ...COMING_SOON, tournament: null });
});

// POST /api/v1/tournaments
router.post('/', authRequired, async (c) => {
  return c.json({ ...COMING_SOON }, 503);
});

// POST /api/v1/tournaments/:id/join
router.post('/:id/join', authRequired, async (c) => {
  return c.json({ ...COMING_SOON }, 503);
});

// GET /api/v1/tournaments/:id/bracket
router.get('/:id/bracket', async (c) => {
  return c.json({ ...COMING_SOON, bracket: null });
});

export default router;
