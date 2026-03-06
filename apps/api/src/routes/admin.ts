import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { db } from '../db';
import { reports, battles, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { adminRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/admin/reports
router.get('/reports', adminRequired, async (c) => {
  const status = c.req.query('status') || 'open';
  const allReports = await db
    .select()
    .from(reports)
    .where(eq(reports.status, status))
    .limit(50);
  return c.json(allReports);
});

// POST /api/v1/admin/battles/:id/remove
router.post('/battles/:id/remove', adminRequired, async (c) => {
  const { id } = c.req.param();
  await db.update(battles).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(battles.id, id));
  return c.json({ message: 'Battle removed' });
});

// POST /api/v1/admin/users/:id/suspend
router.post('/users/:id/suspend', adminRequired, async (c) => {
  const { id } = c.req.param();
  await db.update(users).set({ status: 'suspended', updatedAt: new Date() }).where(eq(users.id, id));
  return c.json({ message: 'User suspended' });
});

export default router;
