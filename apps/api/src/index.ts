import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRouter from './routes/auth';
import battlesRouter from './routes/battles';
import usersRouter from './routes/users';
import leaderboardsRouter from './routes/leaderboards';
import dailyPicksRouter from './routes/dailyPicks';
import adminRouter from './routes/admin';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://cardbattles.app'],
    credentials: true,
  })
);

// Health
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API v1 routes
const api = new Hono();
api.route('/auth', authRouter);
api.route('/battles', battlesRouter);
api.route('/users', usersRouter);
api.route('/leaderboards', leaderboardsRouter);
api.route('/daily-picks', dailyPicksRouter);
api.route('/admin', adminRouter);

app.route('/api/v1', api);

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('[API Error]', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const PORT = parseInt(process.env.PORT || '8000');
console.log(`[API] Card Battles API starting on port ${PORT}`);

serve({ fetch: app.fetch, port: PORT });

export default app;
