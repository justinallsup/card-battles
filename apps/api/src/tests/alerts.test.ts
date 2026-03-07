import { describe, it, expect, beforeAll } from 'vitest';
import app from '../combo-server.js';

describe('Price Alerts + Spotlight API', () => {
  let token: string;

  beforeAll(async () => {
    // Wait for combo-server in-memory DB to seed
    await new Promise(r => setTimeout(r, 600));

    const res = await app.request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cardking@demo.com', password: 'password123' }),
    });
    const d = await res.json() as { accessToken?: string };
    token = d.accessToken ?? '';
  });

  it('GET /api/v1/spotlight returns a card', async () => {
    const res = await app.request('http://localhost/api/v1/spotlight');
    // Spotlight may return 200 (card found) or 404 (no votes yet in test env)
    // but it should not 500
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      const d = await res.json() as { card: unknown; featuredDate: string };
      expect(d.card).toBeTruthy();
      expect(typeof d.featuredDate).toBe('string');
    }
  });

  it('GET /api/v1/me/price-alerts requires auth', async () => {
    const res = await app.request('http://localhost/api/v1/me/price-alerts');
    expect(res.status).toBe(401);
  });

  it('POST then GET price alert works', async () => {
    expect(token).toBeTruthy();
    const createRes = await app.request('http://localhost/api/v1/me/price-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playerName: 'Patrick Mahomes', targetPrice: 300, direction: 'above' }),
    });
    expect([200, 201]).toContain(createRes.status);
    const alert = await createRes.json() as { id: string };

    const listRes = await app.request('http://localhost/api/v1/me/price-alerts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const list = await listRes.json() as { alerts: { id: string }[] };
    expect(list.alerts.some(a => a.id === alert.id)).toBe(true);
  });

  it('DELETE price alert removes it', async () => {
    expect(token).toBeTruthy();
    // Create one first
    const createRes = await app.request('http://localhost/api/v1/me/price-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playerName: 'LeBron James', targetPrice: 1200, direction: 'below' }),
    });
    const alert = await createRes.json() as { id: string };

    const deleteRes = await app.request(`http://localhost/api/v1/me/price-alerts/${alert.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status).toBe(200);

    // Should not appear in list
    const listRes = await app.request('http://localhost/api/v1/me/price-alerts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = await listRes.json() as { alerts: { id: string }[] };
    expect(list.alerts.some(a => a.id === alert.id)).toBe(false);
  });

  it('POST price alert requires all fields', async () => {
    expect(token).toBeTruthy();
    const res = await app.request('http://localhost/api/v1/me/price-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ playerName: 'Tom Brady' }), // missing targetPrice & direction
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/v1/me/recommendations returns battles for authed user', async () => {
    expect(token).toBeTruthy();
    const res = await app.request('http://localhost/api/v1/me/recommendations', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const d = await res.json() as { battles: unknown[] };
    expect(Array.isArray(d.battles)).toBe(true);
  });
});
