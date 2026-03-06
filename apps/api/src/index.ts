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

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://cardbattles.app'],
  credentials: true,
}));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString(), version: '0.1.0' }));

const api = new Hono();
api.route('/auth', authRouter);
api.route('/assets', assetsRouter);
api.route('/battles', battlesRouter);
api.route('/users', usersRouter);
api.route('/leaderboards', leaderboardsRouter);
api.route('/daily-picks', dailyPicksRouter);
api.route('/admin', adminRouter);
api.route('/billing', billingRouter);
app.route('/api/v1', api);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => { console.error('[API]', err); return c.json({ error: 'Internal server error' }, 500); });

async function start() {
  await initStorage();
  const PORT = parseInt(process.env.PORT || '8000');
  console.log(`[API] Starting on port ${PORT}`);
  serve({ fetch: app.fetch, port: PORT });
}
start().catch((e) => { console.error(e); process.exit(1); });
export default app;
