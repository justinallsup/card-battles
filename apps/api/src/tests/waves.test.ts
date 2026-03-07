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
