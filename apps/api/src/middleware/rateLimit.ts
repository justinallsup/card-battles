import { Context, Next } from 'hono';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyFn: (c: Context) => string;
}

export function rateLimit(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const key = `ratelimit:${options.keyFn(c)}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, options.windowSeconds);
    }
    if (current > options.max) {
      return c.json(
        { error: 'Too many requests', retryAfter: options.windowSeconds },
        429
      );
    }
    await next();
  };
}

export const voteRateLimit = rateLimit({
  windowSeconds: 60,
  max: 30,
  keyFn: (c) => {
    const userId = c.get('userId');
    return userId ? `vote:user:${userId}` : `vote:ip:${c.req.header('x-forwarded-for') || 'unknown'}`;
  },
});

export const authRateLimit = rateLimit({
  windowSeconds: 60,
  max: 10,
  keyFn: (c) => `auth:ip:${c.req.header('x-forwarded-for') || 'unknown'}`,
});
