import { describe, it, expect, beforeAll } from 'vitest';
import app from '../index';

async function req(path: string, opts: RequestInit = {}) {
  const res = await app.request(`http://localhost${path}`, opts);
  return { status: res.status, body: await res.json() };
}

describe('Battles', () => {
  let accessToken = '';
  let battleId = '';
  let leftAssetId = '';
  let rightAssetId = '';

  beforeAll(async () => {
    // Register + login
    const username = `battle_test_${Date.now()}`;
    const email = `${username}@example.com`;
    const reg = await app.request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password: 'password123' }),
    });
    const regBody = await reg.json();
    accessToken = regBody.accessToken;

    // We'd need real assets — skip asset creation in unit tests, use seeded data
    // For integration tests, seed first
  });

  it('returns battle feed', async () => {
    const { status, body } = await req('/api/v1/battles/feed');
    expect(status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('returns 404 for nonexistent battle', async () => {
    const { status } = await req('/api/v1/battles/00000000-0000-0000-0000-000000000000');
    expect(status).toBe(404);
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

describe('Leaderboards', () => {
  it('returns leaderboard', async () => {
    const { status, body } = await req('/api/v1/leaderboards?type=creators&period=week');
    expect(status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.type).toBe('creators');
  });
});
