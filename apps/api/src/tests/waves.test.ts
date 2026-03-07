import { describe, it, expect, beforeAll } from 'vitest';
import app from '../combo-server.js';

describe('Wave 31-32 Features', () => {
  let token: string;

  beforeAll(async () => {
    // Wait for combo-server DB init + seed
    await new Promise((r) => setTimeout(r, 500));

    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cardking@demo.com', password: 'password123' }),
    });
    const d = await res.json() as { accessToken: string };
    token = d.accessToken;
  }, 15000);

  it('GET /api/v1/categories returns 8 categories', async () => {
    const res = await app.request('/api/v1/categories');
    expect(res.status).toBe(200);
    const d = await res.json() as { categories: unknown[] };
    expect(d.categories.length).toBe(8);
  });

  it('GET /api/v1/rarity-tiers returns 5 tiers', async () => {
    const res = await app.request('/api/v1/rarity-tiers');
    expect(res.status).toBe(200);
    const d = await res.json() as { tiers: Record<string, unknown> };
    expect(Object.keys(d.tiers).length).toBe(5);
  });

  it('GET /api/v1/events returns seasonal events', async () => {
    const res = await app.request('/api/v1/events');
    expect(res.status).toBe(200);
    const d = await res.json() as { events: unknown[] };
    expect(d.events.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/series returns battle series', async () => {
    const res = await app.request('/api/v1/series');
    expect(res.status).toBe(200);
    const d = await res.json() as { series: unknown[] };
    expect(d.series.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/me/gift-cards requires auth', async () => {
    const res = await app.request('/api/v1/me/gift-cards');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/gift-cards creates and returns code', async () => {
    const res = await app.request('/api/v1/gift-cards', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: 10 }),
    });
    expect([200, 201]).toContain(res.status);
    const d = await res.json() as { code: string; amount: number };
    expect(typeof d.code).toBe('string');
    expect(d.amount).toBe(10);
  });

  it('GET /api/v1/me/challenges requires auth', async () => {
    const res = await app.request('/api/v1/me/challenges');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/milestones returns community milestones', async () => {
    const res = await app.request('/api/v1/milestones');
    expect(res.status).toBe(200);
    const d = await res.json() as { milestones: unknown[] };
    expect(d.milestones.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/me/reminders requires auth', async () => {
    const res = await app.request('/api/v1/me/reminders');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/card-sets/:id/cards returns cards for set', async () => {
    const res = await app.request('/api/v1/card-sets/prizm/cards');
    expect(res.status).toBe(200);
    const d = await res.json() as { cards: unknown[] };
    expect(d.cards.length).toBeGreaterThan(0);
  });
});

describe('Wave 33-38 Features', () => {
  let token: string;

  beforeAll(async () => {
    await new Promise((r) => setTimeout(r, 200));

    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cardking@demo.com', password: 'password123' }),
    });
    const d = await res.json() as { accessToken: string };
    token = d.accessToken;
  }, 15000);

  it('GET /api/v1/authentication-guide returns guide data', async () => {
    const res = await app.request('/api/v1/authentication-guide');
    expect(res.status).toBe(200);
    const d = await res.json() as { redFlags: unknown[]; howToVerify: unknown[] };
    expect(d.redFlags.length).toBeGreaterThan(0);
    expect(d.howToVerify.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/storage-guide returns tips', async () => {
    const res = await app.request('/api/v1/storage-guide');
    expect(res.status).toBe(200);
    const d = await res.json() as { tips: unknown[] };
    expect(d.tips.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/grading-services returns 3 services', async () => {
    const res = await app.request('/api/v1/grading-services');
    expect(res.status).toBe(200);
    const d = await res.json() as { services: unknown[] };
    expect(d.services.length).toBe(3);
  });

  it('GET /api/v1/battle-of-the-day returns a battle', async () => {
    const res = await app.request('/api/v1/battle-of-the-day');
    expect(res.status).toBe(200);
    const d = await res.json() as { battle: unknown; date: string };
    expect(d.battle).toBeTruthy();
    expect(typeof d.date).toBe('string');
  });

  it('GET /api/v1/me/investment-watch requires auth', async () => {
    const res = await app.request('/api/v1/me/investment-watch');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/me/export requires auth', async () => {
    const res = await app.request('/api/v1/me/export');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/me/export returns data for authed user', async () => {
    const res = await app.request('/api/v1/me/export', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const d = await res.json() as { exportedAt: string; votes: unknown[] };
    expect(typeof d.exportedAt).toBe('string');
    expect(Array.isArray(d.votes)).toBe(true);
  });

  it('GET /api/v1/analytics/overview returns stats', async () => {
    const res = await app.request('/api/v1/analytics/overview');
    expect(res.status).toBe(200);
    const d = await res.json() as { totalBattles: number; totalVotes: number };
    expect(typeof d.totalBattles).toBe('number');
    expect(typeof d.totalVotes).toBe('number');
  });

  it('GET /api/v1/featured returns featured content', async () => {
    const res = await app.request('/api/v1/featured');
    expect(res.status).toBe(200);
    const d = await res.json() as { weekOf: string };
    expect(typeof d.weekOf).toBe('string');
  });

  it('GET /api/v1/trending/players returns players', async () => {
    const res = await app.request('/api/v1/trending/players');
    expect(res.status).toBe(200);
    const d = await res.json() as { players: unknown[] };
    expect(Array.isArray(d.players)).toBe(true);
  });
});
