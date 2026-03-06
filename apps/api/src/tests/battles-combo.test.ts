/**
 * Extended battle tests using the in-memory combo-server.
 * These tests don't require a real Postgres/Redis connection.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import comboApp from '../combo-server';

type JsonBody = Record<string, unknown>;

async function req(path: string, opts: RequestInit = {}): Promise<{ status: number; body: JsonBody }> {
  const res = await comboApp.request(`http://localhost${path}`, opts);
  return { status: res.status, body: await res.json() };
}

// Wait for the in-memory DB to be ready (combo-server initialises on first request)
let authToken = '';
let battleId = '';
let leftAssetId = '';
let rightAssetId = '';

describe('Battles — extended (combo-server)', () => {
  beforeAll(async () => {
    // Give the combo-server time to start its init promise
    await new Promise((r) => setTimeout(r, 500));

    // Register a fresh user
    const username = `battle_ext_${Date.now()}`;
    const reg = await comboApp.request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: `${username}@example.com`, password: 'password123' }),
    });
    const regBody = (await reg.json()) as { accessToken?: string };
    authToken = regBody.accessToken ?? '';

    // Get a battle from the feed for testing votes
    const feed = await comboApp.request('http://localhost/api/v1/battles/feed');
    const feedBody = (await feed.json()) as { items?: Array<{ id: string; left?: { assetId: string }; right?: { assetId: string } }> };
    const first = feedBody.items?.[0];
    if (first) {
      battleId = first.id;
      leftAssetId = first.left?.assetId ?? '';
      rightAssetId = first.right?.assetId ?? '';
    }
  }, 15000);

  it('GET /battles/feed returns items array', async () => {
    const { status, body } = await req('/api/v1/battles/feed');
    expect(status).toBe(200);
    expect(Array.isArray((body as { items: unknown[] }).items)).toBe(true);
  });

  it('GET /battles/:id returns battle details', async () => {
    if (!battleId) return; // skip if no seed data
    const { status, body } = await req(`/api/v1/battles/${battleId}`);
    expect(status).toBe(200);
    expect((body as { id: string }).id).toBe(battleId);
  });

  it('returns 404 for nonexistent battle', async () => {
    const { status } = await req('/api/v1/battles/00000000-0000-0000-0000-000000000000');
    expect(status).toBe(404);
  });

  it('rejects vote with invalid choice returns 400', async () => {
    if (!battleId || !authToken) return;
    const { status } = await req(`/api/v1/battles/${battleId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ category: 'investment', choice: 'center' }),
    });
    expect(status).toBe(400);
  });

  it('can vote on a battle category', async () => {
    if (!battleId || !authToken) return;
    const { status, body } = await req(`/api/v1/battles/${battleId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ category: 'investment', choice: 'left' }),
    });
    // 200 = success, 409 = already voted (fine either way)
    expect([200, 409]).toContain(status);
    if (status === 200) {
      const b = body as { leftPercent?: number; rightPercent?: number };
      expect(typeof b.leftPercent).toBe('number');
      expect(typeof b.rightPercent).toBe('number');
    }
  });

  it('voting twice on same category returns 409', async () => {
    if (!battleId || !authToken) return;

    // Register a second user who hasn't voted yet
    const username2 = `voter2_${Date.now()}`;
    const reg2 = await comboApp.request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username2, email: `${username2}@example.com`, password: 'password123' }),
    });
    const reg2Body = (await reg2.json()) as { accessToken?: string };
    const token2 = reg2Body.accessToken ?? '';

    // First vote — should succeed
    await req(`/api/v1/battles/${battleId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ category: 'rarity', choice: 'right' }),
    });

    // Second vote on same category — should return 409
    const { status } = await req(`/api/v1/battles/${battleId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ category: 'rarity', choice: 'left' }),
    });
    expect(status).toBe(409);
  });

  it('GET /battles/:id/results returns percentages', async () => {
    if (!battleId) return;
    const { status, body } = await req(`/api/v1/battles/${battleId}/results`);
    expect(status).toBe(200);
    const b = body as { battleId: string; live?: { byCategory?: Record<string, { leftPercent: number; rightPercent: number }> } };
    expect(b.battleId).toBe(battleId);
    expect(b.live?.byCategory).toBeDefined();
    const categories = Object.values(b.live?.byCategory ?? {});
    for (const cat of categories) {
      expect(typeof cat.leftPercent).toBe('number');
      expect(typeof cat.rightPercent).toBe('number');
    }
  });

  it('rejects battle creation without auth', async () => {
    const { status } = await req('/api/v1/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', leftAssetId: 'x', rightAssetId: 'y', categories: ['investment'], durationSeconds: 3600 }),
    });
    expect(status).toBe(401);
  });
});

describe('Leaderboards (combo-server)', () => {
  it('GET /leaderboards?type=creators returns items array', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators');
    expect(status).toBe(200);
    expect(Array.isArray((body as { items: unknown[] }).items)).toBe(true);
    expect((body as { type: string }).type).toBe('creators');
  });

  it('GET /leaderboards?type=voters returns items array', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=voters');
    expect(status).toBe(200);
    expect(Array.isArray((body as { items: unknown[] }).items)).toBe(true);
    expect((body as { type: string }).type).toBe('voters');
  });

  it('GET /leaderboards?period=week works', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators&period=week');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('week');
  });

  it('GET /leaderboards?period=month works', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators&period=month');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('month');
  });

  it('GET /leaderboards?period=all works', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=voters&period=all');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('all');
  });
});

describe('Health (combo-server)', () => {
  it('GET /health returns ok', async () => {
    const { status, body } = await req('/health');
    expect(status).toBe(200);
    expect((body as { status: string }).status).toBe('ok');
    expect((body as { version: string }).version).toBeTruthy();
  });
});
