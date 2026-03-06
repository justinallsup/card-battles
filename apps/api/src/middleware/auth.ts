import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  sub: string; // user id
  username: string;
  isAdmin: boolean;
  isMod: boolean;
}

export async function authRequired(c: Context, next: Next) {
  const header = c.req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    c.set('userId', payload.sub);
    c.set('username', payload.username);
    c.set('isAdmin', payload.isAdmin);
    c.set('isMod', payload.isMod);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export async function optionalAuth(c: Context, next: Next) {
  const header = c.req.header('Authorization');
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      c.set('userId', payload.sub);
      c.set('username', payload.username);
      c.set('isAdmin', payload.isAdmin);
      c.set('isMod', payload.isMod);
    } catch {
      // ignore invalid token for optional auth
    }
  }
  await next();
}

export async function adminRequired(c: Context, next: Next) {
  await authRequired(c, async () => {});
  if (!c.get('isAdmin')) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
}
