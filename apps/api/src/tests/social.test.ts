import { describe, it, expect, beforeAll } from 'vitest';
import app from '../combo-server.js';

describe('Social features API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Wait for combo-server DB init + seed
    await new Promise((r) => setTimeout(r, 500));

    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cardking@demo.com', password: 'password123' })
    });
    const data = await res.json() as { accessToken: string; user: { id: string } };
    token = data.accessToken;
    userId = data.user?.id;
  }, 15000);

  it('GET /api/v1/community/feed returns events', async () => {
    const res = await app.request('/api/v1/community/feed');
    expect(res.status).toBe(200);
    const data = await res.json() as { events: unknown[] };
    expect(Array.isArray(data.events)).toBe(true);
  });

  it('GET /api/v1/users/discover returns users', async () => {
    const res = await app.request('/api/v1/users/discover');
    expect(res.status).toBe(200);
    const data = await res.json() as { users: unknown[] };
    expect(Array.isArray(data.users)).toBe(true);
  });

  it('GET /api/v1/news returns articles', async () => {
    const res = await app.request('/api/v1/news');
    expect(res.status).toBe(200);
    const data = await res.json() as { articles: unknown[] };
    expect(data.articles.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/news with sport filter works', async () => {
    const res = await app.request('/api/v1/news?sport=nfl');
    expect(res.status).toBe(200);
    const data = await res.json() as { articles: { sport: string }[] };
    data.articles.forEach(a => expect(['nfl', 'all']).toContain(a.sport));
  });

  it('GET /api/v1/trades requires auth', async () => {
    const res = await app.request('/api/v1/trades');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/trades creates trade proposal', async () => {
    // Get another user id
    const usersRes = await app.request('/api/v1/users/discover');
    const usersData = await usersRes.json() as { users: { id: string }[] };
    const otherUser = usersData.users.find(u => u.id !== userId);
    if (!otherUser) return; // skip if only 1 user

    // Get a card
    const cardsRes = await app.request('/api/v1/cards/search?q=mahomes');
    const cardsData = await cardsRes.json() as { cards: { id: string }[] };
    const cardId = cardsData.cards[0]?.id;
    if (!cardId) return;

    const res = await app.request('/api/v1/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUserId: otherUser.id, offeredCardIds: [cardId], requestedCardIds: [cardId], message: 'Test trade' }),
    });
    expect([200, 201]).toContain(res.status);
  });

  it('GET /api/v1/me/portfolio requires auth', async () => {
    const res = await app.request('/api/v1/me/portfolio');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/me/portfolio returns portfolio for authed user', async () => {
    const res = await app.request('/api/v1/me/portfolio', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { totalValue: number; cardCount: number };
    expect(typeof data.totalValue).toBe('number');
    expect(typeof data.cardCount).toBe('number');
  });
});
