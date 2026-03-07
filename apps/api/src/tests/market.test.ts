import { describe, it, expect } from 'vitest';
import app from '../combo-server.js';

describe('Market API', () => {
  it('GET /api/v1/market/feed returns items', async () => {
    const res = await app.request('/api/v1/market/feed');
    const data = await res.json() as {items:unknown[]};
    expect(res.status).toBe(200);
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('GET /api/v1/market/top-movers returns gainers and losers', async () => {
    const res = await app.request('/api/v1/market/top-movers');
    const data = await res.json() as {gainers:unknown[];losers:unknown[]};
    expect(res.status).toBe(200);
    expect(Array.isArray(data.gainers)).toBe(true);
    expect(Array.isArray(data.losers)).toBe(true);
  });

  it('GET /api/v1/auctions returns auctions array', async () => {
    const res = await app.request('/api/v1/auctions');
    const data = await res.json() as {auctions:unknown[]};
    expect(res.status).toBe(200);
    expect(Array.isArray(data.auctions)).toBe(true);
  });

  it('GET /api/v1/hall-of-fame returns inductees', async () => {
    const res = await app.request('/api/v1/hall-of-fame');
    const data = await res.json() as {inductees:unknown[]};
    expect(res.status).toBe(200);
    expect(Array.isArray(data.inductees)).toBe(true);
  });

  it('GET /api/v1/card-sets returns sets', async () => {
    const res = await app.request('/api/v1/card-sets');
    const data = await res.json() as {sets:unknown[]};
    expect(res.status).toBe(200);
    expect(data.sets.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/players returns player list', async () => {
    const res = await app.request('/api/v1/players');
    const data = await res.json() as {players:unknown[]};
    expect(res.status).toBe(200);
    expect(Array.isArray(data.players)).toBe(true);
  });

  it('GET /api/v1/marketplace returns listings', async () => {
    const res = await app.request('/api/v1/marketplace');
    const data = await res.json() as {listings:unknown[]};
    expect(res.status).toBe(200);
    expect(Array.isArray(data.listings)).toBe(true);
  });

  it('POST /api/v1/waitlist requires valid email', async () => {
    const bad = await app.request('/api/v1/waitlist', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email:'notvalid'})
    });
    expect(bad.status).toBe(400);
    const good = await app.request('/api/v1/waitlist', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email:'test@test.com'})
    });
    expect(good.status).toBe(200);
  });
});
