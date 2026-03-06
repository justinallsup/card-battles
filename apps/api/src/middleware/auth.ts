import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import type { AppVariables } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  sub: string;
  username: string;
  isAdmin: boolean;
  isMod: boolean;
}

type AppContext = Context<{ Variables: AppVariables }>;

export async function authRequired(c: AppContext, next: Next) {
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

export async function optionalAuth(c: AppContext, next: Next) {
  const header = c.req.header('Authorization');
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      c.set('userId', payload.sub);
      c.set('username', payload.username);
      c.set('isAdmin', payload.isAdmin);
      c.set('isMod', payload.isMod);
    } catch {}
  }
  await next();
}

export async function adminRequired(c: AppContext, next: Next) {
  await authRequired(c, async () => {});
  if (!c.get('isAdmin')) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
}
