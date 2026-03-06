import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
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

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://cardbattles.app'],
  credentials: true,
}));

app.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '0.1.0',
  routes: ['/api/v1/auth', '/api/v1/battles', '/api/v1/assets', '/api/v1/users',
           '/api/v1/leaderboards', '/api/v1/daily-picks', '/api/v1/share', '/api/v1/analytics'],
}));

const api = new Hono();
api.route('/auth', authRouter);
api.route('/assets', assetsRouter);
api.route('/battles', battlesRouter);
api.route('/users', usersRouter);
api.route('/leaderboards', leaderboardsRouter);
api.route('/daily-picks', dailyPicksRouter);
api.route('/admin', adminRouter);
api.route('/billing', billingRouter);
api.route('/share', shareRouter);
api.route('/analytics', analyticsRouter);

app.route('/api/v1', api);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => { console.error('[API]', err); return c.json({ error: 'Internal server error' }, 500); });

async function start() {
  await initStorage();
  const PORT = parseInt(process.env.PORT || '8000');
  console.log(`[API] Card Battles API ready on :${PORT}`);
  serve({ fetch: app.fetch, port: PORT });
}
start().catch((e) => { console.error(e); process.exit(1); });
export default app;
