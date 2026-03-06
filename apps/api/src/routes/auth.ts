import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { users, userStats } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authRateLimit } from '../middleware/rateLimit';
import { authRequired } from '../middleware/auth';

const router = new Hono();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = `${process.env.JWT_ACCESS_EXPIRES_MINUTES || 60}m`;
const REFRESH_EXPIRES = `${process.env.JWT_REFRESH_EXPIRES_DAYS || 30}d`;

function makeTokens(user: { id: string; username: string; isAdmin: boolean; isMod: boolean }) {
  const payload = { sub: user.id, username: user.username, isAdmin: user.isAdmin, isMod: user.isMod };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// POST /api/v1/auth/register
router.post('/register', authRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(8).max(100),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { username, email, password } = parsed.data;

  // Check duplicates
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const existingUsername = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUsername.length > 0) {
    return c.json({ error: 'Username already taken' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      username,
      email: email.toLowerCase(),
      passwordHash,
    })
    .returning();

  // Create stats row
  await db.insert(userStats).values({ userId: user.id });

  const tokens = makeTokens(user);

  return c.json({ user: sanitizeUser(user), ...tokens }, 201);
});

// POST /api/v1/auth/login
router.post('/login', authRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed' }, 400);
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user || !user.passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  if (user.status !== 'active') {
    return c.json({ error: 'Account suspended' }, 403);
  }

  // Update last active
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

  const tokens = makeTokens(user);
  return c.json({ user: sanitizeUser(user), ...tokens });
});

// POST /api/v1/auth/logout
router.post('/logout', (c) => {
  // Stateless JWT — client discards tokens
  return c.json({ message: 'Logged out' });
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.refreshToken) {
    return c.json({ error: 'Refresh token required' }, 400);
  }

  try {
    const payload = jwt.verify(body.refreshToken, JWT_REFRESH_SECRET) as {
      sub: string;
      username: string;
      isAdmin: boolean;
      isMod: boolean;
    };

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || user.status !== 'active') {
      return c.json({ error: 'User not found or suspended' }, 401);
    }

    const tokens = makeTokens(user);
    return c.json(tokens);
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
});

// GET /api/v1/auth/me
router.get('/me', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(sanitizeUser(user));
});

export default router;
