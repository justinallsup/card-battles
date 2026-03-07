import { describe, it, expect, beforeAll } from 'vitest';
import app from '../combo-server.js';

describe('Creator & Gamification API', () => {
  let token: string;

  beforeAll(async () => {
    // Wait for combo-server DB init + seed
    await new Promise((r) => setTimeout(r, 500));

    const res = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cardking@demo.com', password: 'password123' }),
    });
    const d = await res.json() as { accessToken: string };
    token = d.accessToken;
  }, 15000);

  it('GET /api/v1/ranks returns all tiers', async () => {
    const res = await app.request('/api/v1/ranks');
    expect(res.status).toBe(200);
    const d = await res.json() as { ranks: { name: string }[] };
    expect(d.ranks.length).toBeGreaterThanOrEqual(4);
    expect(d.ranks[0].name).toBe('Rookie');
  });

  it('GET /api/v1/me/rank requires auth', async () => {
    const res = await app.request('/api/v1/me/rank');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/me/rank returns rank data for authed user', async () => {
    const res = await app.request('/api/v1/me/rank', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const d = await res.json() as { currentRank: { name: string }; points: number };
    expect(d.currentRank.name).toBeTruthy();
    expect(typeof d.points).toBe('number');
  });

  it('GET /api/v1/me/wishlist requires auth', async () => {
    const res = await app.request('/api/v1/me/wishlist');
    expect(res.status).toBe(401);
  });

  it('POST then GET wishlist works', async () => {
    // Get a card ID
    const cr = await app.request('/api/v1/cards/search?q=mahomes');
    const cd = await cr.json() as { cards: { id: string }[] };
    const cardId = cd.cards[0]?.id;
    if (!cardId) return;

    const addRes = await app.request(`/api/v1/me/wishlist/${cardId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201]).toContain(addRes.status);

    const listRes = await app.request('/api/v1/me/wishlist', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const ld = await listRes.json() as { cards: { id: string }[] };
    expect(ld.cards.some(c => c.id === cardId)).toBe(true);
  });

  it('GET /api/v1/me/earnings requires auth', async () => {
    const res = await app.request('/api/v1/me/earnings');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/me/earnings returns earnings data', async () => {
    const res = await app.request('/api/v1/me/earnings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const d = await res.json() as { totalEarned: number; battleCount: number };
    expect(typeof d.totalEarned).toBe('number');
    expect(typeof d.battleCount).toBe('number');
  });

  it('GET /api/v1/packs returns pack list', async () => {
    const res = await app.request('/api/v1/packs');
    expect(res.status).toBe(200);
    const d = await res.json() as { packs: unknown[] };
    expect(d.packs.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/packs/:id/open requires auth', async () => {
    const res = await app.request('/api/v1/packs/prizm-blaster/open', { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
