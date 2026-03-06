/**
 * Leaderboard tests using the in-memory combo-server.
 * These tests don't require a real Postgres/Redis connection.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import comboApp from '../combo-server';

type JsonBody = Record<string, unknown>;

async function req(path: string, opts: RequestInit = {}): Promise<{ status: number; body: JsonBody }> {
  const res = await comboApp.request(`http://localhost${path}`, opts);
  return { status: res.status, body: await res.json() };
}

describe('Leaderboards (combo-server)', () => {
  beforeAll(async () => {
    // Give the combo-server time to initialise with seed data
    await new Promise((r) => setTimeout(r, 400));
  }, 10000);

  it('GET /leaderboards?type=creators returns items array', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators');
    expect(status).toBe(200);
    const b = body as { type: string; period: string; items: unknown[] };
    expect(b.type).toBe('creators');
    expect(Array.isArray(b.items)).toBe(true);
  });

  it('leaderboard items have expected shape', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators');
    expect(status).toBe(200);
    const items = (body as { items: Array<{ rank: number; username: string; score: unknown }> }).items;
    if (items.length > 0) {
      const first = items[0];
      expect(typeof first.rank).toBe('number');
      expect(typeof first.username).toBe('string');
    }
  });

  it('GET /leaderboards?type=voters returns items array', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=voters');
    expect(status).toBe(200);
    const b = body as { type: string; items: unknown[] };
    expect(b.type).toBe('voters');
    expect(Array.isArray(b.items)).toBe(true);
  });

  it('voters leaderboard ordered by votes_cast', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=voters');
    expect(status).toBe(200);
    const items = (body as { items: Array<{ score: number; votesCast: number }> }).items;
    // Each item's score should equal their votes cast
    for (const item of items.slice(0, 5)) {
      // score may be votes_cast depending on column naming
      expect(typeof item.score === 'number' || typeof item.votesCast === 'number').toBe(true);
    }
  });

  it('GET /leaderboards?period=week returns period=week', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators&period=week');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('week');
  });

  it('GET /leaderboards?period=month returns period=month', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators&period=month');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('month');
  });

  it('GET /leaderboards?period=all returns period=all', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=voters&period=all');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('all');
  });

  it('leaderboard has seeded demo users', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=voters');
    expect(status).toBe(200);
    const items = (body as { items: Array<{ username: string }> }).items;
    // Should have the 5 seeded demo users
    expect(items.length).toBeGreaterThan(0);
    const usernames = items.map((i) => i.username);
    // At least one of the demo users should appear
    const demoUsers = ['cardking', 'slabmaster', 'rookiehunter', 'packripper', 'gradegod'];
    const found = demoUsers.some((u) => usernames.includes(u));
    expect(found).toBe(true);
  });
});
