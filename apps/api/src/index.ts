import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { sql } from 'drizzle-orm';
import { db } from './db';
import { initStorage } from './utils/initStorage';
import authRouter from './routes/auth';
import battlesRouter from './routes/battles';
import assetsRouter from './routes/assets';
import usersRouter from './routes/users';
import leaderboardsRouter from './routes/leaderboards';
import dailyPicksRouter from './routes/dailyPicks';
import adminRouter from './routes/admin';
import billingRouter from './routes/billing';
import shareRouter from './routes/share';
import analyticsRouter from './routes/analytics';
import commentsRouter from './routes/comments';
import collectionsRouter from './routes/collections';
import followingRouter from './routes/following';
import tournamentsRouter from './routes/tournaments';
import fantasyRouter from './routes/fantasy';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://cardbattles.app'],
  credentials: true,
}));

// Health check — queries real Postgres if DATABASE_URL is set
app.get('/health', async (c) => {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as battles FROM battles`);
    return c.json({
      status: 'ok',
      db: 'connected',
      battles: result.rows[0]?.battles || 0,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  } catch (e) {
    return c.json({
      status: 'ok',
      db: 'disconnected',
      error: String(e),
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    }, 200);
  }
});

const api = new Hono();
api.route('/auth', authRouter);
api.route('/assets', assetsRouter);
api.route('/battles', battlesRouter);
// Comments are sub-routes of battles: /api/v1/battles/:battleId/comments
api.route('/battles', commentsRouter);
api.route('/users', usersRouter);
// Following sub-routes: /api/v1/users/:username/follow|unfollow|follow-status|followers|following
api.route('/users', followingRouter);
api.route('/leaderboards', leaderboardsRouter);
api.route('/daily-picks', dailyPicksRouter);
api.route('/admin', adminRouter);
api.route('/billing', billingRouter);
api.route('/share', shareRouter);
api.route('/analytics', analyticsRouter);
api.route('/collections', collectionsRouter);
api.route('/tournaments', tournamentsRouter);
api.route('/fantasy', fantasyRouter);

app.route('/api/v1', api);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => { console.error('[API]', err); return c.json({ error: 'Internal server error' }, 500); });

async function start() {
  await initStorage();
  const PORT = parseInt(process.env.PORT || '8000');
  console.log(`[API] Card Battles API ready on :${PORT}`);
  serve({ fetch: app.fetch, port: PORT });
}

// Only start the HTTP server when running directly (not during tests or imports)
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  start().catch((e) => { console.error(e); process.exit(1); });
}

export default app;
