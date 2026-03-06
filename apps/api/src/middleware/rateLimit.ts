import { Context, Next } from 'hono';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  // Fail fast when Redis is unavailable (e.g. in test environments)
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  lazyConnect: true,
  connectTimeout: 1000,
});

// Track Redis availability to avoid cascading hangs
let redisAvailable = true;
redis.on('error', () => { redisAvailable = false; });
redis.on('ready', () => { redisAvailable = true; });

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyFn: (c: Context) => string;
}

export function rateLimit(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    if (!redisAvailable) {
      // Redis unavailable — skip rate limiting (fail open)
      return next();
    }
    try {
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
    } catch {
      // Redis error — skip rate limiting (fail open)
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
